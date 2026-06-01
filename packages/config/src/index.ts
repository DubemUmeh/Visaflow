import 'dotenv/config';

// Application-wide constants
export const APP_CONFIG = {
  name: 'VisaFlow',
  tagline: 'Your Visa. Simplified.',
  description:
    'Apply for visas online with VisaFlow — the fastest, most trusted way to get your travel documents.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://visaflow.com',
  api: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  supportEmail: 'support@visaflow.com',
  socialLinks: {
    twitter: 'https://twitter.com/visaflow',
    instagram: 'https://instagram.com/visaflow',
    facebook: 'https://facebook.com/visaflow',
    linkedin: 'https://linkedin.com/company/visaflow',
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  maxSizeMB: 10,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  allowedDocTypes: ['application/pdf'],
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
  ],
} as const;

// Application statuses
export const APPLICATION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  MISSING_DOCUMENTS: 'MISSING_DOCUMENTS',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

// Processing speed tiers
export const PROCESSING_TIER = {
  STANDARD: 'STANDARD',
  EXPEDITED: 'EXPEDITED',
  RUSH: 'RUSH',
} as const;

// User roles
export const USER_ROLE = {
  APPLICANT: 'APPLICANT',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

// Notification channels
export const NOTIFICATION_CHANNEL = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  IN_APP: 'IN_APP',
  PUSH: 'PUSH',
} as const;

// Cache TTLs (seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 min
  MEDIUM: 300, // 5 min
  LONG: 3600, // 1 hr
  VERY_LONG: 86400, // 24 hrs
  WEEK: 604800, // 7 days
} as const;

// Supported locales
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['code'];
export type ApplicationStatus = keyof typeof APPLICATION_STATUS;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;
export type ProcessingTier = keyof typeof PROCESSING_TIER;
export type UserRole = keyof typeof USER_ROLE;
export type NotificationChannel = keyof typeof NOTIFICATION_CHANNEL;
