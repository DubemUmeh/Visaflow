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
  visaRequirements,
} from '@visaflow/database';
import type {
  ApplicationEntity,
  ApplicationStatus,
  ApplicationProgress,
  ApplicationSummary,
  CountrySummary,
  DocumentType,
  PaymentSummary,
  UploadedDocumentEntity,
  VisaTypeSummary,
} from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
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
type RequirementRow = Pick<InferModel<typeof visaRequirements>, 'documentType'>;

const ACCEPTABLE_PAYMENT_DOCUMENT_STATUSES = [
  'PROCESSING',
  'VERIFIED',
] as const;
const EDITABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'DRAFT',
  'MISSING_DOCUMENTS',
  'REJECTED',
];

@Injectable()
export class ApplicationService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    progress?: ApplicationProgress,
  ): ApplicationSummary {
    return {
      id: app.id,
      referenceNumber: app.referenceNumber,
      userId: app.userId,
      status: app.status,
      processingTier: app.processingTier,
      completionPercentage: progress?.currentStep
        ? Math.round((progress.completedSteps.length / app.totalSteps) * 100)
        : app.completionPercentage,
      isComplete: progress?.isComplete,
      canPay: progress?.canPay,
      canSubmit: progress?.canSubmit,
      missingRequirements: progress?.missingRequirements,
      currentStep: progress?.currentStep ?? app.currentStep,
      applicantFirstName: app.applicantFirstName || '',
      applicantLastName: app.applicantLastName || '',
      destinationCountry: this.toCountrySummary(destinationCountry),
      visaType: this.toVisaTypeSummary(visaType),
      submittedAt: this.toIso(app.submittedAt),
      createdAt: this.toIso(app.createdAt) ?? '',
    };
  }

  private hasValue(value: unknown) {
    return value !== null && value !== undefined && value !== '';
  }

  private calculateApplicationProgress(params: {
    app: ApplicationRow;
    requirements: RequirementRow[];
    documents: DocumentRow[];
    payments: PaymentRow[];
  }): ApplicationProgress {
    const { app, requirements, documents, payments } = params;
    const requiredTypes = requirements.map(
      (requirement) => requirement.documentType,
    );
    const activeSatisfyingDocumentTypes = new Set(
      documents
        .filter((doc) =>
          ACCEPTABLE_PAYMENT_DOCUMENT_STATUSES.includes(
            doc.status as (typeof ACCEPTABLE_PAYMENT_DOCUMENT_STATUSES)[number],
          ),
        )
        .map((doc) => doc.documentType),
    );
    const missingRequirements = requiredTypes.filter(
      (documentType) => !activeSatisfyingDocumentTypes.has(documentType),
    );

    const completedSteps: number[] = [];
    if (
      this.hasValue(app.visaTypeId) &&
      this.hasValue(app.destinationCountryId) &&
      this.hasValue(app.nationalityCountryId)
    ) {
      completedSteps.push(1);
    }
    if (
      this.hasValue(app.applicantFirstName) &&
      this.hasValue(app.applicantLastName) &&
      this.hasValue(app.applicantEmail) &&
      this.hasValue(app.applicantPassportNo) &&
      this.hasValue(app.applicantPassportExpiry)
    ) {
      completedSteps.push(2);
    }
    if (this.hasValue(app.travelDateFrom) && this.hasValue(app.travelDateTo)) {
      completedSteps.push(3);
    }
    if (missingRequirements.length === 0) {
      completedSteps.push(4);
    }

    const isComplete = [1, 2, 3, 4].every((step) =>
      completedSteps.includes(step),
    );
    if (isComplete) completedSteps.push(5);
    const terminalOrSubmitted = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'COMPLETED',
      'CANCELLED',
    ].includes(app.status);
    const hasCompletedPayment = payments.some(
      (payment) => payment.status === 'COMPLETED',
    );
    const canPay = isComplete && !terminalOrSubmitted && !hasCompletedPayment;
    const canSubmit = canPay;
    const isEditable = EDITABLE_APPLICATION_STATUSES.includes(app.status);
    const currentStep = isComplete
      ? 5
      : ([1, 2, 3, 4].find((step) => !completedSteps.includes(step)) ?? 1);

    return {
      applicationId: app.id,
      currentStep,
      completedSteps,
      missingRequirements: missingRequirements as DocumentType[],
      isComplete,
      canPay,
      canSubmit,
      isEditable,
    };
  }

  private async getRequiredDocumentRequirements(visaTypeId: string) {
    return this.dbClient.db
      .select({ documentType: visaRequirements.documentType })
      .from(visaRequirements)
      .where(
        and(
          eq(visaRequirements.visaTypeId, visaTypeId),
          eq(visaRequirements.isRequired, true),
        ),
      );
  }

  private toEntity(params: {
    app: ApplicationRow;
    visaType: VisaTypeRow;
    destinationCountry: CountryRow | null;
    nationalityCountry: CountryRow | null;
    documents: DocumentRow[];
    payments: PaymentRow[];
    statusHistory: StatusHistoryRow[];
    requirements: RequirementRow[];
  }): ApplicationEntity {
    const {
      app,
      visaType,
      destinationCountry,
      nationalityCountry,
      documents,
      payments: paymentRows,
      statusHistory,
      requirements,
    } = params;
    const progress = this.calculateApplicationProgress({
      app,
      requirements,
      documents,
      payments: paymentRows,
    });

    return {
      id: app.id,
      referenceNumber: app.referenceNumber,
      userId: app.userId,
      visaTypeId: app.visaTypeId,
      destinationCountryId: app.destinationCountryId || '',
      nationalityCountryId: app.nationalityCountryId || '',
      status: app.status,
      processingTier: app.processingTier,
      totalSteps: app.totalSteps,
      completionPercentage: Math.round(
        (progress.completedSteps.length / app.totalSteps) * 100,
      ),
      progress,
      isComplete: progress.isComplete,
      canPay: progress.canPay,
      canSubmit: progress.canSubmit,
      missingRequirements: progress.missingRequirements,
      completedSteps: progress.completedSteps,
      isEditable: progress.isEditable,
      currentStep: progress.currentStep,
      submittedAt: this.toIso(app.submittedAt),
      approvedAt: this.toIso(app.approvedAt),
      rejectedAt: this.toIso(app.rejectedAt),
      completedAt: this.toIso(app.completedAt),
      expiresAt: this.toIso(app.expiresAt),
      travelDateFrom: this.toIso(app.travelDateFrom),
      travelDateTo: this.toIso(app.travelDateTo),
      applicantFirstName: app.applicantFirstName || '',
      applicantLastName: app.applicantLastName || '',
      applicantEmail: app.applicantEmail || '',
      applicantPhone: app.applicantPhone,
      applicantDob: this.toIso(app.applicantDob),
      applicantPassportNo: app.applicantPassportNo,
      applicantPassportExpiry: this.toIso(app.applicantPassportExpiry),
      formData: (app.formData as Record<string, unknown>) ?? {},
      rejectionReason: app.rejectionReason,
      missingDocumentsNote: app.missingDocumentsNote,
      visaType: this.toVisaTypeSummary(visaType),
      destinationCountry: destinationCountry ? this.toCountrySummary(destinationCountry) : null,
      nationalityCountry: nationalityCountry ? this.toCountrySummary(nationalityCountry) : null,
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
    const [existingDraft] = await this.dbClient.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.visaTypeId, dto.visaTypeId),
          eq(applications.status, 'DRAFT'),
          isNull(applications.deletedAt),
        ),
      )
      .orderBy(desc(applications.createdAt))
      .limit(1);

    if (existingDraft) {
      return this.findById(existingDraft.id, userId);
    }

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
        currentStep: 1,
        totalSteps: 5,
        completionPercentage: 0,
        draftData: dto.formData ?? {},
        applicantFirstName: dto.applicantFirstName,
        applicantLastName: dto.applicantLastName,
        applicantEmail: dto.applicantEmail,
        applicantPhone: dto.applicantPhone,
        applicantDob: this.toDate(dto.applicantDob),
        applicantPassportNo: dto.applicantPassportNo,
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
      note: 'Application draft saved pending required documents',
      isSystemChange: true,
    });

    await this.notificationsService.createSystemNotification({
      userId,
      applicationId: created.id,
      channel: 'IN_APP',
      subject: 'Application draft completed',
      body: 'Your visa application draft has been saved. Complete all required documents before payment and submission.',
      recipient: dto.applicantEmail || '',
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
        app.destinationCountryId
          ? this.dbClient.db
              .select()
              .from(countries)
              .where(eq(countries.id, app.destinationCountryId))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        app.nationalityCountryId
          ? this.dbClient.db
              .select()
              .from(countries)
              .where(eq(countries.id, app.nationalityCountryId))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

    if (!visaType) {
      throw new NotFoundException('Application visa type could not be loaded');
    }

    const [documentRows, paymentRows, historyRows, requirementRows] =
      await Promise.all([
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
        this.getRequiredDocumentRequirements(app.visaTypeId),
      ]);

    return this.toEntity({
      app,
      visaType,
      destinationCountry,
      nationalityCountry,
      documents: documentRows,
      payments: paymentRows,
      statusHistory: historyRows,
      requirements: requirementRows,
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
      visaTypeId: dto.visaTypeId,
      destinationCountryId: dto.destinationCountryId,
      nationalityCountryId: dto.nationalityCountryId,
      applicantFirstName: dto.applicantFirstName,
      applicantLastName: dto.applicantLastName,
      applicantEmail: dto.applicantEmail,
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

  async getProgress(applicationId: string, userId: string, role?: string) {
    const application = await this.findById(applicationId, userId, role);
    return application.progress;
  }

  async assertEligibleForPayment(
    applicationId: string,
    userId?: string,
    role?: string,
  ) {
    const application = userId
      ? await this.findById(applicationId, userId, role)
      : await this.findById(applicationId, '', 'SUPER_ADMIN');

    if (!application.canPay) {
      const missing = application.missingRequirements.length
        ? ` Missing requirements: ${application.missingRequirements.join(', ')}.`
        : '';
      throw new ForbiddenException(
        `Application is not ready for payment.${missing}`.trim(),
      );
    }

    return application;
  }

  async assertRequiredDocumentsUploaded(applicationId: string) {
    const application = await this.findById(applicationId, '', 'SUPER_ADMIN');
    if (application.missingRequirements.length > 0) {
      throw new ForbiddenException(
        `Required documents are missing: ${application.missingRequirements.join(', ')}`,
      );
    }
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

    if (dto.status === 'SUBMITTED') {
      await this.assertRequiredDocumentsUploaded(id);
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

    const reason =
      dto.rejectionReason ??
      dto.missingDocumentsNote ??
      dto.note ??
      'No additional note was added by the review team.';
    await this.notificationsService.createSystemNotification({
      userId: existing.userId,
      applicationId: id,
      channel: 'IN_APP',
      subject: `Application status changed to ${dto.status.replace(/_/g, ' ')}`,
      body: `Your application moved from ${existing.status.replace(/_/g, ' ')} to ${dto.status.replace(/_/g, ' ')}. Reason: ${reason}`,
      recipient: existing.applicantEmail || '',
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
