// ============================================================
// VisaFlow — Shared Entity Types
// Mirror of Prisma models for use in frontend/API contracts
// ============================================================

export type UserRole = "APPLICANT" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
export type AuthProvider = "LOCAL" | "GOOGLE" | "APPLE";
export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MISSING_DOCUMENTS"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";
export type ProcessingTier = "STANDARD" | "EXPEDITED" | "RUSH";
export type VisaEntryType = "SINGLE" | "DOUBLE" | "MULTIPLE";
export type DocumentType =
  | "PASSPORT_PHOTO"
  | "PASSPORT_COPY"
  | "BANK_STATEMENT"
  | "INVITATION_LETTER"
  | "TRAVEL_ITINERARY"
  | "HOTEL_BOOKING"
  | "FLIGHT_ITINERARY"
  | "EMPLOYMENT_LETTER"
  | "FINANCIAL_PROOF"
  | "BIRTH_CERTIFICATE"
  | "MARRIAGE_CERTIFICATE"
  | "TRAVEL_INSURANCE"
  | "YELLOW_FEVER_CERT"
  | "BUSINESS_REGISTRATION"
  | "VISA_FOR_DESTINATION"
  | "OTHER";
export type DocumentStatus =
  "PENDING" | "UPLOADING" | "PROCESSING" | "VERIFIED" | "REJECTED" | "EXPIRED";
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export type PaymentProvider = "WALLET" | "PAYPAL";
export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP" | "PUSH";
export type SupportTicketStatus =
  "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserEntity {
  id: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null; // ISO date string
  nationality: string | null;
  passportNumber: string | null;
  preferredLocale: string;
  timezone: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
}

// ── Country ────────────────────────────────────────────────────────────────

export interface CountryEntity {
  id: string;
  name: string;
  code: string;
  code3: string;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  flagEmoji: string | null;
  flagImageUrl: string | null;
  phoneCode: string | null;
  currency: string | null;
  currencySymbol: string | null;
  languages: string[];
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroImageUrl: string | null;
  overview: string | null;
  travelTips: string | null;
  isPublished: boolean;
  visaTypesCount: number;
  avgProcessingDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySummary {
  id: string;
  name: string;
  code: string;
  flagEmoji: string | null;
  slug: string;
  visaTypesCount: number;
  avgProcessingDays: number | null;
}

// ── Visa Type ────────────────────────────────────────────────────────────────

export interface VisaTypeEntity {
  id: string;
  name: string;
  code: string;
  slug: string;
  destinationCountryId: string;
  nationalityCountryId: string | null;
  entryType: VisaEntryType;
  stayDuration: number | null;
  validityPeriod: number | null;
  description: string | null;
  requirements: string | null;
  notes: string | null;
  isVisaRequired: boolean;
  isVisaOnArrival: boolean;
  isEVisa: boolean;
  processingDaysMin: number;
  processingDaysMax: number;
  processingDaysExpedited: number | null;
  processingDaysRush: number | null;
  priceStandard: number; // cents
  priceExpedited: number | null; // cents
  priceRush: number | null; // cents
  govFee: number; // cents
  serviceFee: number; // cents
  isPublished: boolean;
  destinationCountry: CountrySummary;
  nationalityCountry: CountrySummary | null;
  requirements_list: VisaRequirementEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface VisaRequirementEntity {
  id: string;
  visaTypeId: string;
  documentType: DocumentType;
  name: string;
  description: string | null;
  isRequired: boolean;
  isOptional: boolean;
  sortOrder: number;
  helpText: string | null;
  exampleUrl: string | null;
  maxFileSizeMB: number;
  allowedFormats: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Eligibility ───────────────────────────────────────────────────────────

export interface EligibilityResult {
  nationalityCountry: CountrySummary;
  destinationCountry: CountrySummary;
  isVisaRequired: boolean;
  isVisaOnArrival: boolean;
  isEVisa: boolean;
  stayDurationDays: number | null;
  notes: string | null;
  availableVisaTypes: VisaTypeSummary[];
}

export interface VisaTypeSummary {
  id: string;
  name: string;
  slug: string;
  entryType: VisaEntryType;
  stayDuration: number | null;
  processingDaysMin: number;
  processingDaysMax: number;
  priceStandard: number;
  priceExpedited: number | null;
  priceRush: number | null;
  isEVisa: boolean;
  isVisaOnArrival: boolean;
}

// ── Application ────────────────────────────────────────────────────────────

export interface ApplicationProgress {
  applicationId: string;
  currentStep: number;
  completedSteps: number[];
  missingRequirements: DocumentType[];
  isComplete: boolean;
  canPay: boolean;
  canSubmit: boolean;
  isEditable: boolean;
}

export interface ApplicationEntity {
  id: string;
  referenceNumber: string;
  userId: string;
  visaTypeId: string;
  destinationCountryId: string;
  nationalityCountryId: string;
  status: ApplicationStatus;
  processingTier: ProcessingTier;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  progress: ApplicationProgress;
  isComplete: boolean;
  canPay: boolean;
  canSubmit: boolean;
  missingRequirements: DocumentType[];
  completedSteps: number[];
  isEditable: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  travelDateFrom: string | null;
  travelDateTo: string | null;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  applicantDob: string | null;
  applicantPassportNo: string | null;
  applicantPassportExpiry: string | null;
  formData: Record<string, unknown>;
  rejectionReason: string | null;
  missingDocumentsNote: string | null;
  visaType: VisaTypeSummary;
  destinationCountry: CountrySummary;
  nationalityCountry: CountrySummary;
  documents: UploadedDocumentEntity[];
  payments: PaymentSummary[];
  statusHistory: ApplicationStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationSummary {
  id: string;
  referenceNumber: string;
  userId?: string;
  status: ApplicationStatus;
  processingTier: ProcessingTier;
  completionPercentage: number;
  isComplete?: boolean;
  canPay?: boolean;
  canSubmit?: boolean;
  missingRequirements?: DocumentType[];
  currentStep?: number;
  applicantFirstName: string;
  applicantLastName: string;
  destinationCountry: CountrySummary;
  visaType: VisaTypeSummary;
  submittedAt: string | null;
  createdAt: string;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  isSystemChange: boolean;
  createdAt: string;
}

// ── Document ────────────────────────────────────────────────────────────────

export interface UploadedDocumentEntity {
  id: string;
  userId: string;
  applicationId: string | null;
  documentType: DocumentType;
  status: DocumentStatus;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  cdnUrl: string | null;
  // R2 object keys stay server-side and are intentionally omitted from public entities.
  thumbnailUrl: string | null;
  ocrProcessed: boolean;
  ocrData: Record<string, unknown> | null;
  ocrConfidence: number | null;
  virusScanStatus: string;
  rejectionReason: string | null;
  documentExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string; // Pre-signed S3 URL
  documentId: string;
  expiresAt: string;
  fields: Record<string, string>; // Legacy form fields
  objectKey: string;
  expiresIn: number;
  headers: Record<string, string>;
}

export interface DocumentDownloadUrlResponse {
  url: string;
  expiresIn: number;
}

// ── Payment ────────────────────────────────────────────────────────────────

export interface PaymentEntity {
  id: string;
  userId: string;
  applicationId: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  amountTotal: number;
  amountGovFee: number;
  amountServiceFee: number;
  amountTax: number;
  amountRefunded: number;
  currency: string;
  processingTier: ProcessingTier;
  description: string | null;
  receiptUrl: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
  lineItems: PaymentLineItemEntity[];
}

export interface PaymentSummary {
  id: string;
  status: PaymentStatus;
  amountTotal: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentLineItemEntity {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  paymentId?: string;
  provider?: "wallet" | "paypal";
  checkoutUrl: string;
  expiresAt: string;
  instructions?: Record<string, unknown>;
}

export interface WalletEntity {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  depositAddress?: WalletAddressEntity;
}

export interface WalletAddressEntity {
  id: string;
  walletId: string;
  userId: string;
  network: string;
  asset: string;
  address: string;
  provider: string;
  createdAt: string;
}

export type WalletTransactionType =
  "DEPOSIT" | "PAYMENT" | "REFUND" | "ADJUSTMENT";

export interface WalletTransactionEntity {
  id: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  currency: string;
  description: string;
  createdAt: string;
}

// ── Notification ────────────────────────────────────────────────────────────

export interface NotificationEntity {
  id: string;
  userId: string;
  applicationId: string | null;
  channel: NotificationChannel;
  status: string;
  subject: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
}

// ── Support ───────────────────────────────────────────────────────────────

export interface SupportTicketEntity {
  id: string;
  userId: string | null;
  applicationId: string | null;
  ticketNumber: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string;
  resolvedAt: string | null;
  createdAt: string;
  requester?: UserEntity | null;
  messages: SupportMessageEntity[];
}

export interface SupportMessageEntity {
  id: string;
  ticketId: string;
  authorId: string | null;
  isInternal: boolean;
  body: string;
  attachments: unknown[];
  author: UserPublicProfile | null;
  createdAt: string;
}
