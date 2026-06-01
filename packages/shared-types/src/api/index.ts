// ============================================================
// VisaFlow — Core API Contract Definitions
// Defines request/response shapes for all API endpoints.
// These are the "contracts" between frontend and backend.
// ============================================================

import type {
  ApplicationStatus,
  ApplicationEntity,
  ApplicationSummary,
  CountryEntity,
  CountrySummary,
  CheckoutSessionResponse,
  EligibilityResult,
  NotificationEntity,
  PaymentEntity,
  ProcessingTier,
  SupportTicketEntity,
  UploadedDocumentEntity,
  UploadUrlResponse,
  UserEntity,
  VisaTypeEntity,
  VisaTypeSummary,
} from '../entities';

// ── Generic API response wrappers ──────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================
// AUTH — /api/v1/auth
// ============================================================

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLocale?: string;
  nationality?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OAuthCallbackRequest {
  provider: 'google' | 'apple';
  idToken: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
  user: UserEntity;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Enable2FAResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  code: string;
}

// ============================================================
// USERS — /api/v1/users
// ============================================================

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  preferredLocale?: string;
  timezone?: string;
}

export interface UpdateAvatarRequest {
  avatarUrl: string;
}

export type GetUserResponse = ApiResponse<UserEntity>;
export type UpdateProfileResponse = ApiResponse<UserEntity>;

// Admin user management
export interface AdminListUsersQuery extends PaginationQuery {
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface AdminUpdateUserRequest {
  role?: string;
  isActive?: boolean;
  isBanned?: boolean;
  bannedReason?: string;
}

// ============================================================
// COUNTRIES — /api/v1/countries
// ============================================================

export interface ListCountriesQuery extends PaginationQuery {
  region?: string;
  isPublished?: boolean;
}

export type ListCountriesResponse = ApiResponse<PaginatedResponse<CountrySummary>>;
export type GetCountryResponse = ApiResponse<CountryEntity>;
export type ListAllCountriesResponse = ApiResponse<CountrySummary[]>;

export interface AdminCreateCountryRequest {
  name: string;
  code: string;
  code3: string;
  capital?: string;
  region?: string;
  subregion?: string;
  flagEmoji?: string;
  phoneCode?: string;
  currency?: string;
  currencySymbol?: string;
  languages?: string[];
  slug: string;
  overview?: string;
  travelTips?: string;
  isPublished?: boolean;
}

// ============================================================
// VISA TYPES — /api/v1/visa-types
// ============================================================

export interface ListVisaTypesQuery extends PaginationQuery {
  destinationCountryId?: string;
  destinationCountryCode?: string;
  nationalityCountryId?: string;
  nationalityCountryCode?: string;
  isPublished?: boolean;
}

export type ListVisaTypesResponse = ApiResponse<PaginatedResponse<VisaTypeSummary>>;
export type GetVisaTypeResponse = ApiResponse<VisaTypeEntity>;

// ============================================================
// ELIGIBILITY — /api/v1/eligibility
// ============================================================

export interface CheckEligibilityRequest {
  nationalityCode: string; // ISO alpha-2
  destinationCode: string; // ISO alpha-2
  travelPurpose?: 'TOURISM' | 'BUSINESS' | 'STUDY' | 'MEDICAL' | 'TRANSIT';
}

export type CheckEligibilityResponse = ApiResponse<EligibilityResult>;

// ============================================================
// APPLICATIONS — /api/v1/applications
// ============================================================

export interface CreateApplicationRequest {
  visaTypeId: string;
  processingTier?: ProcessingTier;
  travelDateFrom?: string;
  travelDateTo?: string;
  // Initial applicant snapshot
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantDob?: string;
  applicantPassportNo?: string;
  applicantPassportExpiry?: string;
}

export interface UpdateApplicationRequest {
  processingTier?: ProcessingTier;
  travelDateFrom?: string;
  travelDateTo?: string;
  applicantPhone?: string;
  applicantDob?: string;
  applicantPassportNo?: string;
  applicantPassportExpiry?: string;
  formData?: Record<string, unknown>;
  currentStep?: number;
}

export interface SaveDraftRequest {
  draftData: Record<string, unknown>;
  currentStep: number;
}

export interface SubmitApplicationRequest {
  applicationId: string;
  finalFormData: Record<string, unknown>;
  agreedToTerms: boolean;
}

export interface ListApplicationsQuery extends PaginationQuery {
  status?: ApplicationStatus;
  destinationCountryId?: string;
}

export type CreateApplicationResponse = ApiResponse<ApplicationEntity>;
export type GetApplicationResponse = ApiResponse<ApplicationEntity>;
export type ListApplicationsResponse = ApiResponse<PaginatedResponse<ApplicationSummary>>;
export type UpdateApplicationResponse = ApiResponse<ApplicationEntity>;

// Admin operations
export interface AdminUpdateApplicationStatusRequest {
  status: ApplicationStatus;
  note?: string;
  rejectionReason?: string;
  missingDocumentsNote?: string;
}

export interface AdminListApplicationsQuery extends PaginationQuery {
  status?: ApplicationStatus;
  destinationCountryId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================
// DOCUMENTS — /api/v1/documents
// ============================================================

export interface RequestUploadUrlRequest {
  applicationId?: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ConfirmUploadRequest {
  documentId: string;
  storageKey: string;
}

export interface ListDocumentsQuery extends PaginationQuery {
  applicationId?: string;
  documentType?: string;
  status?: string;
}

export type RequestUploadUrlResponse = ApiResponse<UploadUrlResponse>;
export type GetDocumentsResponse = ApiResponse<UploadedDocumentEntity[]>;
export type GetDocumentResponse = ApiResponse<UploadedDocumentEntity>;

// Admin
export interface AdminReviewDocumentRequest {
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

// ============================================================
// PAYMENTS — /api/v1/payments
// ============================================================

export interface CreateCheckoutSessionRequest {
  applicationId: string;
  processingTier: ProcessingTier;
  currency?: string;
  promoCode?: string;
  successUrl: string;
  cancelUrl: string;
  provider?: 'stripe' | 'paypal';
}

export interface CreatePayPalOrderRequest {
  applicationId: string;
  processingTier: ProcessingTier;
  currency?: string;
  promoCode?: string;
}

export interface CapturePayPalOrderRequest {
  orderId: string;
}

export interface ApplyPromoCodeRequest {
  code: string;
  applicationId: string;
}

export interface ApplyPromoCodeResponse {
  valid: boolean;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number; // calculated cents off
  newTotal: number;
}

export type CreateCheckoutResponse = ApiResponse<CheckoutSessionResponse>;
export type GetPaymentResponse = ApiResponse<PaymentEntity>;
export type ListPaymentsResponse = ApiResponse<PaginatedResponse<PaymentEntity>>;

// ============================================================
// NOTIFICATIONS — /api/v1/notifications
// ============================================================

export interface ListNotificationsQuery extends PaginationQuery {
  channel?: string;
  isRead?: boolean;
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[]; // empty = mark all
}

export type ListNotificationsResponse = ApiResponse<PaginatedResponse<NotificationEntity>>;
export type UnreadCountResponse = ApiResponse<{ count: number }>;

// ============================================================
// SUPPORT — /api/v1/support
// ============================================================

export interface CreateSupportTicketRequest {
  subject: string;
  body: string;
  category?: string;
  applicationId?: string;
  priority?: string;
  guestEmail?: string;
  guestName?: string;
}

export interface ReplyToTicketRequest {
  body: string;
  attachments?: string[];
}

export interface AdminUpdateTicketRequest {
  status?: SupportTicketEntity['status'];
  priority?: SupportTicketEntity['priority'];
  assignedToId?: string;
  isInternal?: boolean;
}

export type GetTicketResponse = ApiResponse<SupportTicketEntity>;
export type ListTicketsResponse = ApiResponse<PaginatedResponse<SupportTicketEntity>>;

// ============================================================
// AI FEATURES — /api/v1/ai
// ============================================================

export interface ExtractPassportDataRequest {
  documentId: string; // ID of uploaded passport scan
}

export interface ExtractPassportDataResponse {
  documentId: string;
  extractedData: {
    firstName?: string;
    lastName?: string;
    passportNumber?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    nationality?: string;
    issuingCountry?: string;
    mrz?: string;
  };
  confidence: number;
  autofillSuggestions: Record<string, string>;
}

export interface AiRequirementSummaryRequest {
  visaTypeId: string;
  nationalityCode: string;
}

export interface AiRequirementSummaryResponse {
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
  tips: string[];
}

export interface ChatMessageRequest {
  message: string;
  applicationId?: string;
  conversationId?: string;
}

export interface ChatMessageResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
}

// ============================================================
// ADMIN ANALYTICS — /api/v1/admin/analytics
// ============================================================

export interface AnalyticsDashboardResponse {
  overview: {
    totalApplications: number;
    totalRevenue: number; // cents
    activeApplications: number;
    approvalRate: number; // 0-100
    avgProcessingDays: number;
    totalUsers: number;
  };
  applicationsThisWeek: number;
  revenueThisMonth: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  topDestinations: Array<{ country: CountrySummary; count: number }>;
  revenueByDay: Array<{ date: string; revenue: number; count: number }>;
  conversionFunnel: {
    visits: number;
    eligibilityChecks: number;
    applicationsStarted: number;
    applicationsSubmitted: number;
    paymentCompleted: number;
  };
}

// ============================================================
// SEO / PROGRAMMATIC PAGES — /api/v1/seo
// ============================================================

export interface VisaPageSeoData {
  slug: string; // e.g., "visa-from-ghana-to-canada"
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  canonicalUrl: string;
  structuredData: Record<string, unknown>; // JSON-LD
  breadcrumbs: Array<{ name: string; url: string }>;
  nationalityCountry: CountrySummary;
  destinationCountry: CountrySummary;
  visaType: VisaTypeEntity | null;
  eligibility: EligibilityResult | null;
  faqs: Array<{ question: string; answer: string }>;
  lastUpdated: string;
}

export type GetVisaPageSeoResponse = ApiResponse<VisaPageSeoData>;
