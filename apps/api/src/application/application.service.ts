import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull, sql, type InferModel } from 'drizzle-orm';
import {
  applicationStatusHistory,
  applications,
  countries,
  payments,
  uploadedDocuments,
  visaTypes,
} from '@visaflow/database';
import type {
  ApplicationEntity,
  ApplicationStatus,
  ApplicationSummary,
  CountrySummary,
  PaymentSummary,
  UploadedDocumentEntity,
  VisaTypeSummary,
} from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import { generateApplicationReference } from '../common/utils/reference-generator';
import type {
  CreateApplicationDto,
  UpdateApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';

type ApplicationRow = InferModel<typeof applications>;
type VisaTypeRow = InferModel<typeof visaTypes>;
type CountryRow = Pick<
  InferModel<typeof countries>,
  | 'id'
  | 'name'
  | 'code'
  | 'flagEmoji'
  | 'slug'
  | 'visaTypesCount'
  | 'avgProcessingDays'
>;
type DocumentRow = InferModel<typeof uploadedDocuments>;
type PaymentRow = InferModel<typeof payments>;
type StatusHistoryRow = InferModel<typeof applicationStatusHistory>;

@Injectable()
export class ApplicationService {
  constructor(private readonly dbClient: DatabaseService) {}

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private toDate(value: string | undefined) {
    return value ? new Date(`${value}T00:00:00.000Z`) : null;
  }

  private isAdmin(role: string | undefined) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private toCountrySummary(row: CountryRow): CountrySummary {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      flagEmoji: row.flagEmoji,
      slug: row.slug,
      visaTypesCount: row.visaTypesCount,
      avgProcessingDays: row.avgProcessingDays,
    };
  }

  private toVisaTypeSummary(row: VisaTypeRow): VisaTypeSummary {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      entryType: row.entryType,
      stayDuration: row.stayDuration,
      processingDaysMin: row.processingDaysMin,
      processingDaysMax: row.processingDaysMax,
      priceStandard: row.priceStandard,
      priceExpedited: row.priceExpedited,
      priceRush: row.priceRush,
      isEVisa: row.isEVisa,
      isVisaOnArrival: row.isVisaOnArrival,
    };
  }

  private toPaymentSummary(row: PaymentRow): PaymentSummary {
    return {
      id: row.id,
      status: row.status,
      amountTotal: row.amountTotal,
      currency: row.currency,
      paidAt: this.toIso(row.paidAt),
      createdAt: this.toIso(row.createdAt) ?? '',
    };
  }

  private toDocumentEntity(row: DocumentRow): UploadedDocumentEntity {
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

  private toSummary(
    app: ApplicationRow,
    destinationCountry: CountryRow,
    visaType: VisaTypeRow,
  ): ApplicationSummary {
    return {
      id: app.id,
      referenceNumber: app.referenceNumber,
      userId: app.userId,
      status: app.status,
      processingTier: app.processingTier,
      completionPercentage: app.completionPercentage,
      applicantFirstName: app.applicantFirstName,
      applicantLastName: app.applicantLastName,
      destinationCountry: this.toCountrySummary(destinationCountry),
      visaType: this.toVisaTypeSummary(visaType),
      submittedAt: this.toIso(app.submittedAt),
      createdAt: this.toIso(app.createdAt) ?? '',
    };
  }

  private toEntity(params: {
    app: ApplicationRow;
    visaType: VisaTypeRow;
    destinationCountry: CountryRow;
    nationalityCountry: CountryRow;
    documents: DocumentRow[];
    payments: PaymentRow[];
    statusHistory: StatusHistoryRow[];
  }): ApplicationEntity {
    const {
      app,
      visaType,
      destinationCountry,
      nationalityCountry,
      documents,
      payments: paymentRows,
      statusHistory,
    } = params;

    return {
      id: app.id,
      referenceNumber: app.referenceNumber,
      userId: app.userId,
      visaTypeId: app.visaTypeId,
      destinationCountryId: app.destinationCountryId,
      nationalityCountryId: app.nationalityCountryId,
      status: app.status,
      processingTier: app.processingTier,
      currentStep: app.currentStep,
      totalSteps: app.totalSteps,
      completionPercentage: app.completionPercentage,
      submittedAt: this.toIso(app.submittedAt),
      approvedAt: this.toIso(app.approvedAt),
      rejectedAt: this.toIso(app.rejectedAt),
      completedAt: this.toIso(app.completedAt),
      expiresAt: this.toIso(app.expiresAt),
      travelDateFrom: this.toIso(app.travelDateFrom),
      travelDateTo: this.toIso(app.travelDateTo),
      applicantFirstName: app.applicantFirstName,
      applicantLastName: app.applicantLastName,
      applicantEmail: app.applicantEmail,
      applicantPhone: app.applicantPhone,
      applicantDob: this.toIso(app.applicantDob),
      applicantPassportNo: app.applicantPassportNo,
      applicantPassportExpiry: this.toIso(app.applicantPassportExpiry),
      formData: (app.formData as Record<string, unknown>) ?? {},
      rejectionReason: app.rejectionReason,
      missingDocumentsNote: app.missingDocumentsNote,
      visaType: this.toVisaTypeSummary(visaType),
      destinationCountry: this.toCountrySummary(destinationCountry),
      nationalityCountry: this.toCountrySummary(nationalityCountry),
      documents: documents.map((doc) => this.toDocumentEntity(doc)),
      payments: paymentRows.map((payment) => this.toPaymentSummary(payment)),
      statusHistory: statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        isSystemChange: entry.isSystemChange,
        createdAt: this.toIso(entry.createdAt) ?? '',
      })),
      createdAt: this.toIso(app.createdAt) ?? '',
      updatedAt: this.toIso(app.updatedAt) ?? '',
    };
  }

  async findAll(params: {
    userId: string;
    role?: string;
    page: number;
    limit: number;
    status?: ApplicationStatus;
    destinationCountryId?: string;
  }) {
    const { page, limit } = params;
    const { skip, take } = buildPaginationSkipTake(page, limit);
    const conditions = [
      isNull(applications.deletedAt),
      this.isAdmin(params.role)
        ? undefined
        : eq(applications.userId, params.userId),
      params.status ? eq(applications.status, params.status) : undefined,
      params.destinationCountryId
        ? eq(applications.destinationCountryId, params.destinationCountryId)
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];
    const where = and(...conditions);

    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select({
          app: applications,
          destinationCountry: countries,
          visaType: visaTypes,
        })
        .from(applications)
        .innerJoin(
          countries,
          eq(applications.destinationCountryId, countries.id),
        )
        .innerJoin(visaTypes, eq(applications.visaTypeId, visaTypes.id))
        .where(where)
        .orderBy(desc(applications.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(applications)
        .where(where),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const meta = buildPaginationMeta(total, page, limit);

    return {
      items: rows.map((row) =>
        this.toSummary(row.app, row.destinationCountry, row.visaType),
      ),
      total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPrevPage: meta.hasPrevPage,
    };
  }

  async create(userId: string, dto: CreateApplicationDto) {
    const [visaType] = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(and(eq(visaTypes.id, dto.visaTypeId), isNull(visaTypes.deletedAt)))
      .limit(1);

    if (!visaType) {
      throw new NotFoundException('Visa type not found');
    }

    const [created] = await this.dbClient.db
      .insert(applications)
      .values({
        referenceNumber: generateApplicationReference(),
        userId,
        visaTypeId: dto.visaTypeId,
        destinationCountryId: dto.destinationCountryId,
        nationalityCountryId: dto.nationalityCountryId,
        processingTier: dto.processingTier ?? 'STANDARD',
        status: 'DRAFT',
        currentStep: 5,
        totalSteps: 5,
        completionPercentage: 100,
        draftData: dto.formData ?? {},
        applicantFirstName: dto.applicantFirstName,
        applicantLastName: dto.applicantLastName,
        applicantEmail: dto.applicantEmail,
        applicantPhone: dto.applicantPhone ?? null,
        applicantDob: this.toDate(dto.applicantDob),
        applicantPassportNo: dto.applicantPassportNo ?? null,
        applicantPassportExpiry: this.toDate(dto.applicantPassportExpiry),
        travelDateFrom: this.toDate(dto.travelDateFrom),
        travelDateTo: this.toDate(dto.travelDateTo),
        formData: dto.formData ?? {},
      })
      .returning({ id: applications.id });

    if (!created) {
      throw new NotFoundException('Application could not be created');
    }

    await this.dbClient.db.insert(applicationStatusHistory).values({
      applicationId: created.id,
      fromStatus: null,
      toStatus: 'DRAFT',
      note: 'Application draft completed pending payment',
      isSystemChange: true,
    });

    return this.findById(created.id, userId);
  }

  async findById(id: string, userId: string, role?: string) {
    const [app] = await this.dbClient.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), isNull(applications.deletedAt)))
      .limit(1);

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    if (!this.isAdmin(role) && app.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    const [visaType, destinationCountry, nationalityCountry] =
      await Promise.all([
        this.dbClient.db
          .select()
          .from(visaTypes)
          .where(eq(visaTypes.id, app.visaTypeId))
          .limit(1)
          .then((rows) => rows[0]),
        this.dbClient.db
          .select()
          .from(countries)
          .where(eq(countries.id, app.destinationCountryId))
          .limit(1)
          .then((rows) => rows[0]),
        this.dbClient.db
          .select()
          .from(countries)
          .where(eq(countries.id, app.nationalityCountryId))
          .limit(1)
          .then((rows) => rows[0]),
      ]);

    if (!visaType || !destinationCountry || !nationalityCountry) {
      throw new NotFoundException('Application references could not be loaded');
    }

    const [documentRows, paymentRows, historyRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(uploadedDocuments)
        .where(
          and(
            eq(uploadedDocuments.applicationId, app.id),
            isNull(uploadedDocuments.deletedAt),
          ),
        )
        .orderBy(desc(uploadedDocuments.createdAt)),
      this.dbClient.db
        .select()
        .from(payments)
        .where(eq(payments.applicationId, app.id))
        .orderBy(desc(payments.createdAt)),
      this.dbClient.db
        .select()
        .from(applicationStatusHistory)
        .where(eq(applicationStatusHistory.applicationId, app.id))
        .orderBy(desc(applicationStatusHistory.createdAt)),
    ]);

    return this.toEntity({
      app,
      visaType,
      destinationCountry,
      nationalityCountry,
      documents: documentRows,
      payments: paymentRows,
      statusHistory: historyRows,
    });
  }

  async update(
    id: string,
    userId: string,
    role: string | undefined,
    dto: UpdateApplicationDto,
  ) {
    const existing = await this.findById(id, userId, role);
    const patch: Partial<InferModel<typeof applications, 'insert'>> = {
      processingTier: dto.processingTier,
      travelDateFrom: this.toDate(dto.travelDateFrom) ?? undefined,
      travelDateTo: this.toDate(dto.travelDateTo) ?? undefined,
      applicantPhone: dto.applicantPhone,
      applicantDob: this.toDate(dto.applicantDob) ?? undefined,
      applicantPassportNo: dto.applicantPassportNo,
      applicantPassportExpiry:
        this.toDate(dto.applicantPassportExpiry) ?? undefined,
      formData: dto.formData,
      internalNotes: this.isAdmin(role) ? dto.adminNotes : undefined,
    };

    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<InferModel<typeof applications, 'insert'>>;

    if (Object.keys(cleaned).length > 0) {
      await this.dbClient.db
        .update(applications)
        .set(cleaned)
        .where(eq(applications.id, existing.id));
    }

    return this.findById(id, userId, role);
  }

  async updateStatus(
    id: string,
    userId: string,
    role: string | undefined,
    dto: UpdateApplicationStatusDto,
  ) {
    if (!this.isAdmin(role)) {
      throw new ForbiddenException('Only admins can update application status');
    }

    const existing = await this.findById(id, userId, role);
    const now = new Date();
    const statusDates: Partial<InferModel<typeof applications, 'insert'>> = {
      reviewStartedAt: dto.status === 'UNDER_REVIEW' ? now : undefined,
      approvedAt: dto.status === 'APPROVED' ? now : undefined,
      rejectedAt: dto.status === 'REJECTED' ? now : undefined,
      completedAt: dto.status === 'COMPLETED' ? now : undefined,
    };

    await this.dbClient.db
      .update(applications)
      .set({
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        missingDocumentsNote: dto.missingDocumentsNote,
        ...(Object.fromEntries(
          Object.entries(statusDates).filter(
            ([, value]) => value !== undefined,
          ),
        ) as Partial<InferModel<typeof applications, 'insert'>>),
      })
      .where(eq(applications.id, id));

    await this.dbClient.db.insert(applicationStatusHistory).values({
      applicationId: id,
      fromStatus: existing.status,
      toStatus: dto.status,
      changedById: userId,
      note: dto.note ?? null,
      isSystemChange: false,
    });

    return this.findById(id, userId, role);
  }

  async delete(id: string, userId: string, role?: string) {
    const existing = await this.findById(id, userId, role);

    await this.dbClient.db
      .update(applications)
      .set({ deletedAt: new Date() })
      .where(eq(applications.id, existing.id));
  }
}
