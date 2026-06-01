import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, isNull, sql, type InferModel } from 'drizzle-orm';
import { applications, uploadedDocuments } from '@visaflow/database';
import type { UploadedDocumentEntity } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
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

@Injectable()
export class DocumentsService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly configService: ConfigService,
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

  private async assertApplicationAccess(applicationId: string, userId: string, role?: string) {
    const [application] = await this.dbClient.db
      .select({ id: applications.id, userId: applications.userId })
      .from(applications)
      .where(and(eq(applications.id, applicationId), isNull(applications.deletedAt)))
      .limit(1);

    if (!application) throw new NotFoundException('Application not found');
    if (!this.isAdmin(role) && application.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }
  }

  async requestUploadUrl(userId: string, role: string | undefined, dto: RequestUploadUrlDto) {
    if (dto.applicationId) {
      await this.assertApplicationAccess(dto.applicationId, userId, role);
    }

    const safeName = dto.fileName.replace(/[^\w.\-]+/g, '_');
    const storageKey = [
      userId,
      dto.applicationId ?? 'profile',
      `${dto.documentType}-${Date.now()}-${safeName}`,
    ].join('/');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET', 'visaflow-documents');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    const [document] = await this.dbClient.db
      .insert(uploadedDocuments)
      .values({
        userId,
        applicationId: dto.applicationId ?? null,
        documentType: dto.documentType,
        status: 'UPLOADING',
        fileName: safeName,
        originalFileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        storageKey,
        storageBucket: bucket,
        storageRegion: region,
      })
      .returning();

    if (!document) throw new NotFoundException('Document could not be created');

    return {
      documentId: document.id,
      uploadUrl: `/api/v1/documents/${document.id}/mock-upload`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      fields: { storageKey },
    };
  }

  async confirmUpload(userId: string, role: string | undefined, dto: ConfirmUploadDto) {
    const document = await this.findRow(dto.documentId, userId, role);

    await this.dbClient.db
      .update(uploadedDocuments)
      .set({
        status: 'PROCESSING',
        storageKey: dto.storageKey ?? document.storageKey,
        virusScanStatus: 'CLEAN',
      })
      .where(eq(uploadedDocuments.id, document.id));

    return this.findById(document.id, userId, role);
  }

  async findAll(userId: string, role: string | undefined, query: ListDocumentsDto) {
    const { skip, take } = buildPaginationSkipTake(query.page ?? 1, query.limit ?? 20);
    const conditions = [
      isNull(uploadedDocuments.deletedAt),
      this.isAdmin(role) ? undefined : eq(uploadedDocuments.userId, userId),
      query.applicationId ? eq(uploadedDocuments.applicationId, query.applicationId) : undefined,
      query.documentType ? eq(uploadedDocuments.documentType, query.documentType) : undefined,
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
      meta: buildPaginationMeta(Number(countRows[0]?.count ?? 0), query.page ?? 1, query.limit ?? 20),
    };
  }

  private async findRow(id: string, userId: string, role?: string) {
    const [document] = await this.dbClient.db
      .select()
      .from(uploadedDocuments)
      .where(and(eq(uploadedDocuments.id, id), isNull(uploadedDocuments.deletedAt)))
      .limit(1);

    if (!document) throw new NotFoundException('Document not found');
    if (!this.isAdmin(role) && document.userId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }
    return document;
  }

  async findById(id: string, userId: string, role?: string) {
    return this.toEntity(await this.findRow(id, userId, role));
  }

  async review(id: string, userId: string, role: string | undefined, dto: ReviewDocumentDto) {
    if (!this.isAdmin(role)) throw new ForbiddenException('Only admins can review documents');
    await this.findRow(id, userId, role);

    await this.dbClient.db
      .update(uploadedDocuments)
      .set({
        status: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
        reviewedById: userId,
        reviewedAt: new Date(),
      })
      .where(eq(uploadedDocuments.id, id));

    return this.findById(id, userId, role);
  }
}
