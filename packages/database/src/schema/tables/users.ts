import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authProviderEnum } from "../enums/auth-provider";
import { userRoleEnum } from "../enums/user-role";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    phone: text("phone").unique(),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    phoneVerifiedAt: timestamp("phone_verified_at"),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("APPLICANT"),
    authProvider: authProviderEnum("auth_provider").notNull().default("LOCAL"),
    oauthProviderId: text("oauth_provider_id"),

    // Profile
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    avatarUrl: text("avatar_url"),
    dateOfBirth: timestamp("date_of_birth"),
    nationality: text("nationality"), // ISO 3166-1 alpha-2 country code
    passportNumber: text("passport_number"),
    preferredLocale: text("preferred_locale").notNull().default("en"),
    timezone: text("timezone").notNull().default("UTC"),

    // Account state
    isActive: boolean("is_active").notNull().default(true),
    isBanned: boolean("is_banned").notNull().default(false),
    bannedAt: timestamp("banned_at"),
    bannedReason: text("banned_reason"),
    lastLoginAt: timestamp("last_login_at"),
    lastLoginIp: text("last_login_ip"),
    loginCount: integer("login_count").notNull().default(0),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until"),

    // Two-factor auth
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    twoFactorSecret: text("two_factor_secret"),

    // Refresh tokens (stored in Redis, this is a reference)
    currentRefreshTokenHash: text("current_refresh_token_hash"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_phone_idx").on(t.phone),
    index("users_role_idx").on(t.role),
    index("users_deleted_at_idx").on(t.deletedAt),
    index("users_created_at_idx").on(t.createdAt),
  ]
);