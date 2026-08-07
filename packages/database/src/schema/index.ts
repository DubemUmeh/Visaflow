// ============================================================
// VisaFlow — Drizzle ORM Schema (PostgreSQL)
// ============================================================


// ============================================================
// ENUMS
// ============================================================

export * from './enums/application-status';
export * from './enums/audit-action';
export * from './enums/auth-provider';
export * from './enums/document-status';
export * from './enums/document-type';
export * from './enums/notification-channel';
export * from './enums/notification-status';
export * from './enums/payment-provider';
export * from './enums/payment-status';
export * from './enums/wallet-transaction-type';
export * from './enums/deposit-status';
export * from './enums/processing-tier';
export * from './enums/support-ticket-priority';
export * from './enums/support-ticket-status';
export * from './enums/user-role';
export * from './enums/visa-entry-type';


// ============================================================
// CORE USER MODEL
// ============================================================

export * from './tables/user-sessions';
export * from './tables/users';

// ============================================================
// GEOGRAPHY: COUNTRIES & VISA TYPES
// ============================================================

export * from './tables/countries';
export * from './tables/visa-requirements';
export * from './tables/visa-types';
export * from './tables/eligibility-rules';

// ============================================================
// APPLICATIONS
// ============================================================

export * from './tables/application-status-history';
export * from './tables/applications';

// ============================================================
// DOCUMENT MANAGEMENT
// ============================================================

export * from './tables/upload-documents';

// ============================================================
// PAYMENTS
// ============================================================

export * from './tables/payment-line-items';
export * from './tables/payments';
export * from './tables/wallets';
export * from './tables/wallet-addresses';
export * from './tables/wallet-transactions';
export * from './tables/deposits';
export * from './tables/payment-events';

// ============================================================
// NOTIFICATIONS
// ============================================================

export * from './tables/notification-templates';
export * from './tables/notifications';

// ============================================================
// AUDIT LOGS
// ============================================================

export * from './tables/audit-logs';

// ============================================================
// CMS: BLOG & CONTENT
// ============================================================

export * from './tables/blog-posts';
export * from './tables/content-pages';
export * from './tables/faq-items';

// ============================================================
// SUPPORT TICKETS
// ============================================================

export * from './tables/support-messages';
export * from './tables/support-tickets';

// ============================================================
// COUPON / PROMO CODES
// ============================================================

export * from './tables/promo-code';

// ============================================================
// SYSTEM / API KEYS
// ============================================================

export * from './tables/api-keys';
export * from './tables/system-settings';


// ============================================================
// RELATIONS
// ============================================================

export * from './relations/application-status-history-relations';
export * from './relations/applications-relations';
export * from './relations/audit-logs-relations';
export * from './relations/blog-posts-relations';
export * from './relations/countries-relations';
export * from './relations/eligibility-rules-relations';
export * from './relations/notification-relations';
export * from './relations/payment-line-items-relations';
export * from './relations/payments-relations';
export * from './relations/support-messages-relations';
export * from './relations/support-tickets-relations';
export * from './relations/upload-documents-relations';
export * from './relations/user-relations';
export * from './relations/user-sessions-relations'
export * from './relations/visa-requirements-relations';
export * from './relations/visa-types-relations';