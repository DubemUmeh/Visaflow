import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull, sql, type InferModel } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  applications,
  uploadedDocuments,
  visaRequirements,
} from '@visaflow/database';
import type { UploadedDocumentEntity } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { R2StorageService } from '../common/storage/r2-storage.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import type {
  ConfirmUploadDto,
  ListDocumentsDto,
  RequestUploadUrlDto,
  ReviewDocumentDto,
} from './dto/document.dto';

type DocumentRow = InferModel<typeof uploadedDocuments>;
type ApplicationRow = Pick<
  InferModel<typeof applications>,
  'id' | 'userId' | 'status' | 'visaTypeId'
>;

const UPLOAD_EXPIRES_IN = 15 * 60;
const DOWNLOAD_EXPIRES_IN = 5 * 60;
const EDITABLE_APPLICATION_STATUSES = new Set(['DRAFT', 'MISSING_DOCUMENTS']);
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: R2StorageService,
  ) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private toEntity(row: DocumentRow): UploadedDocumentEntity {
    return {
      id: row.id,
      userId: row.userId,
      applicationId: row.applicationId,
      documentType: row.documentType,
      status: row.status,
      fileName: row.fileName,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      cdnUrl: row.cdnUrl,
      thumbnailUrl: row.thumbnailUrl,
      ocrProcessed: row.ocrProcessed,
      ocrData: (row.ocrData as Record<string, unknown> | null) ?? null,
      ocrConfidence: row.ocrConfidence,
      virusScanStatus: row.virusScanStatus,
      rejectionReason: row.rejectionReason,
      documentExpiryDate: this.toIso(row.documentExpiryDate),
      createdAt: this.toIso(row.createdAt) ?? '',
      updatedAt: this.toIso(row.updatedAt) ?? '',
    };
  }

  private async assertApplicationAccess(
    applicationId: string,
    userId: string,
    role?: string,
  ) {
    const [application] = await this.dbClient.db
      .select({
        id: applications.id,
        userId: applications.userId,
        status: applications.status,
        visaTypeId: applications.visaTypeId,
      })
      .from(applications)
      .where(
        and(eq(applications.id, applicationId), isNull(applications.deletedAt)),
      )
      .limit(1);

    if (!application) throw new NotFoundException('Application not found');
    if (!this.isAdmin(role) && application.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }
    return application;
  }

  private assertEditable(application: ApplicationRow) {
    if (!EDITABLE_APPLICATION_STATUSES.has(application.status)) {
      throw new ForbiddenException(
        'Application documents can no longer be modified',
      );
    }
  }

  private async getRequirement(
    application: ApplicationRow,
    documentType: string,
  ) {
    const [requirement] = await this.dbClient.db
      .select()
      .from(visaRequirements)
      .where(
        and(
          eq(visaRequirements.visaTypeId, application.visaTypeId),
          eq(visaRequirements.documentType, documentType as never),
        ),
      )
      .limit(1);
    if (!requirement)
      throw new BadRequestException(
        'Invalid document type for this application',
      );
    return requirement;
  }

  private validateFile(
    dto: RequestUploadUrlDto,
    requirement: InferModel<typeof visaRequirements>,
  ) {
    const allowedFormats = requirement.allowedFormats?.length
      ? requirement.allowedFormats
      : ['pdf', 'jpg', 'jpeg', 'png'];
    const allowedMimeTypes = new Set(
      allowedFormats.flatMap(
        (format) => ALLOWED_MIME_TYPES[format.toLowerCase()] ?? [],
      ),
    );
    if (!allowedMimeTypes.has(dto.mimeType)) {
      throw new BadRequestException('Invalid MIME type for this document');
    }
    const maxBytes = (requirement.maxFileSizeMB ?? 10) * 1024 * 1024;
    if (dto.sizeBytes > maxBytes) {
      throw new BadRequestException(
        `File is too large. Maximum size is ${requirement.maxFileSizeMB ?? 10} MB`,
      );
    }
  }

  private objectKey(
    applicationId: string,
    documentType: string,
    mimeType: string,
  ) {
    const extension =
      Object.entries(ALLOWED_MIME_TYPES).find(([, types]) =>
        types.includes(mimeType),
      )?.[0] ?? 'bin';
    return `applications/${applicationId}/${documentType.toLowerCase()}/${randomUUID()}.${extension}`;
  }

  async requestUploadUrl(
    userId: string,
    role: string | undefined,
    dto: RequestUploadUrlDto,
  ) {
    if (!dto.applicationId)
      throw new BadRequestException(
        'applicationId is required for visa application documents',
      );
    const application = await this.assertApplicationAccess(
      dto.applicationId,
      userId,
      role,
    );
    this.assertEditable(application);
    const requirement = await this.getRequirement(
      application,
      dto.documentType,
    );
    this.validateFile(dto, requirement);

    const safeName =
      dto.fileName
        .replace(/[\r\n/\\]+/g, ' ')
        .trim()
        .slice(0, 255) || 'document';
    const storageKey = this.objectKey(
      application.id,
      dto.documentType,
      dto.mimeType,
    );
    const [document] = await this.dbClient.db
      .insert(uploadedDocuments)
      .values({
        userId: application.userId,
        applicationId: application.id,
        documentType: dto.documentType,
        status: 'UPLOADING',
        fileName: safeName,
        originalFileName: safeName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        storageKey,
        storageBucket: this.storageService.bucketName,
        storageRegion: 'auto',
      })
      .returning();
    if (!document) throw new NotFoundException('Document could not be created');

    return {
      documentId: document.id,
      uploadUrl: await this.storageService.generateUploadUrl({
        key: storageKey,
        contentType: dto.mimeType,
        expiresIn: UPLOAD_EXPIRES_IN,
      }),
      objectKey: storageKey,
      expiresIn: UPLOAD_EXPIRES_IN,
      expiresAt: new Date(Date.now() + UPLOAD_EXPIRES_IN * 1000).toISOString(),
      headers: { 'Content-Type': dto.mimeType },
      fields: { storageKey },
    };
  }

  async confirmUpload(
    userId: string,
    role: string | undefined,
    dto: ConfirmUploadDto,
  ) {
    const document = await this.findRow(dto.documentId, userId, role);
    if (!document.applicationId)
      throw new BadRequestException('Document is not linked to an application');
    const application = await this.assertApplicationAccess(
      document.applicationId,
      userId,
      role,
    );
    this.assertEditable(application);
    if (dto.storageKey && dto.storageKey !== document.storageKey)
      throw new BadRequestException(
        'Upload key does not match the generated upload',
      );
    const metadata = await this.storageService.headObject(document.storageKey);
    if (metadata.contentType && metadata.contentType !== document.mimeType)
      throw new BadRequestException(
        'Uploaded object MIME type does not match the requested upload',
      );
    if (metadata.contentLength && metadata.contentLength > document.sizeBytes)
      throw new BadRequestException(
        'Uploaded object size exceeds the requested upload size',
      );

    await this.notificationsService.createSystemNotification({
      userId: document.userId,
      applicationId: document.applicationId,
      channel: 'IN_APP',
      subject: 'Document upload received',
      body: `Your ${document.documentType.replace(/_/g, ' ').toLowerCase()} document (${document.originalFileName}) was uploaded successfully and is now processing.`,
      recipient: document.userId,
    });

    await this.dbClient.db
      .update(uploadedDocuments)
      .set({
        status: 'PROCESSING',
        sizeBytes: metadata.contentLength || document.sizeBytes,
        checksum: metadata.etag,
        virusScanStatus: 'PENDING',
      })
      .where(eq(uploadedDocuments.id, document.id));

    return this.findById(document.id, userId, role);
  }

  async getDownloadUrl(
    applicationId: string,
    documentId: string,
    userId: string,
    role?: string,
  ) {
    await this.assertApplicationAccess(applicationId, userId, role);
    const document = await this.findRow(documentId, userId, role);
    if (document.applicationId !== applicationId)
      throw new NotFoundException('Document not found for this application');
    return {
      url: await this.storageService.generateDownloadUrl({
        key: document.storageKey,
        fileName: document.originalFileName,
        expiresIn: DOWNLOAD_EXPIRES_IN,
      }),
      expiresIn: DOWNLOAD_EXPIRES_IN,
    };
  }

  async remove(
    applicationId: string,
    documentId: string,
    userId: string,
    role?: string,
  ) {
    const application = await this.assertApplicationAccess(
      applicationId,
      userId,
      role,
    );
    this.assertEditable(application);
    const document = await this.findRow(documentId, userId, role);
    if (document.applicationId !== applicationId)
      throw new NotFoundException('Document not found for this application');
    await this.storageService.deleteObject(document.storageKey);
    await this.dbClient.db
      .update(uploadedDocuments)
      .set({ deletedAt: new Date() })
      .where(eq(uploadedDocuments.id, document.id));
    return { deleted: true };
  }

  async findAll(
    userId: string,
    role: string | undefined,
    query: ListDocumentsDto,
  ) {
    const { skip, take } = buildPaginationSkipTake(
      query.page ?? 1,
      query.limit ?? 20,
    );
    const conditions = [
      isNull(uploadedDocuments.deletedAt),
      this.isAdmin(role) ? undefined : eq(uploadedDocuments.userId, userId),
      query.applicationId
        ? eq(uploadedDocuments.applicationId, query.applicationId)
        : undefined,
      query.documentType
        ? eq(uploadedDocuments.documentType, query.documentType)
        : undefined,
      query.status ? eq(uploadedDocuments.status, query.status) : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];
    const where = and(...conditions);
    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(uploadedDocuments)
        .where(where)
        .orderBy(desc(uploadedDocuments.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(uploadedDocuments)
        .where(where),
    ]);
    return {
      data: rows.map((row) => this.toEntity(row)),
      meta: buildPaginationMeta(
        Number(countRows[0]?.count ?? 0),
        query.page ?? 1,
        query.limit ?? 20,
      ),
    };
  }

  private async findRow(id: string, userId: string, role?: string) {
    const [document] = await this.dbClient.db
      .select()
      .from(uploadedDocuments)
      .where(
        and(eq(uploadedDocuments.id, id), isNull(uploadedDocuments.deletedAt)),
      )
      .limit(1);
    if (!document) throw new NotFoundException('Document not found');
    if (!this.isAdmin(role) && document.userId !== userId)
      throw new ForbiddenException('You do not have access to this document');
    return document;
  }

  async findById(id: string, userId: string, role?: string) {
    return this.toEntity(await this.findRow(id, userId, role));
  }

  async review(
    id: string,
    userId: string,
    role: string | undefined,
    dto: ReviewDocumentDto,
  ) {
    if (!this.isAdmin(role))
      throw new ForbiddenException('Only admins can review documents');
    const document = await this.findRow(id, userId, role);
    await this.dbClient.db
      .update(uploadedDocuments)
      .set({
        status: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        reviewedById: userId,
        reviewedAt: new Date(),
      })
      .where(eq(uploadedDocuments.id, id));
    await this.notificationsService.createSystemNotification({
      userId: document.userId,
      applicationId: document.applicationId ?? undefined,
      channel: 'IN_APP',
      subject: `Document ${dto.status.toLowerCase()}`,
      body:
        dto.status === 'REJECTED'
          ? `Your ${document.documentType.replace(/_/g, ' ').toLowerCase()} document was rejected. Reason: ${dto.rejectionReason ?? 'No rejection reason was provided.'}`
          : `Your ${document.documentType.replace(/_/g, ' ').toLowerCase()} document was verified successfully.`,
      recipient: document.userId,
    });
    return this.findById(id, userId, role);
  }
}
