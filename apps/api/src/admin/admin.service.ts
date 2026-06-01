import { Injectable } from '@nestjs/common';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import {
  applications,
  payments,
  supportTickets,
  systemSettings,
  users,
} from '@visaflow/database';
import { DatabaseService } from '../common/database/database.service';
import type { UpdateSettingsDto } from './dto/admin.dto';

const DEFAULT_SETTINGS = {
  general: {
    siteName: 'VisaFlow',
    supportEmail: 'support@visaflow.com',
    defaultTimezone: 'UTC',
    defaultLanguage: 'en',
  },
  notifications: {
    newApplicationEmail: true,
    statusChangeEmail: true,
    weeklyDigest: false,
    slackIntegration: false,
  },
  system: {
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerify: true,
    autoAssignApplications: false,
  },
  security: {
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
  },
};

@Injectable()
export class AdminService {
  constructor(private readonly dbClient: DatabaseService) {}

  async analytics() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalApps,
      pendingApps,
      approvedApps,
      rejectedApps,
      totalUsers,
      revenue,
      openTickets,
    ] = await Promise.all([
      this.dbClient.db.select({ count: sql`count(*)` }).from(applications).where(isNull(applications.deletedAt)),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(applications)
        .where(and(isNull(applications.deletedAt), sql`${applications.status} in ('SUBMITTED', 'UNDER_REVIEW', 'MISSING_DOCUMENTS')`)),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(applications)
        .where(and(isNull(applications.deletedAt), sql`${applications.status} in ('APPROVED', 'COMPLETED')`)),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(applications)
        .where(and(isNull(applications.deletedAt), eq(applications.status, 'REJECTED'))),
      this.dbClient.db.select({ count: sql`count(*)` }).from(users).where(isNull(users.deletedAt)),
      this.dbClient.db
        .select({ cents: sql`coalesce(sum(${payments.amountTotal}), 0)` })
        .from(payments)
        .where(and(eq(payments.status, 'COMPLETED'), gte(payments.createdAt, monthStart))),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(supportTickets)
        .where(and(isNull(supportTickets.deletedAt), sql`${supportTickets.status} in ('OPEN', 'IN_PROGRESS')`)),
    ]);

    const totalApplications = Number(totalApps[0]?.count ?? 0);
    const approved = Number(approvedApps[0]?.count ?? 0);

    return {
      overview: {
        totalApplications,
        totalRevenue: Number(revenue[0]?.cents ?? 0),
        activeApplications: Number(pendingApps[0]?.count ?? 0),
        approvalRate: totalApplications ? Math.round((approved / totalApplications) * 100) : 0,
        avgProcessingDays: 3,
        totalUsers: Number(totalUsers[0]?.count ?? 0),
      },
      pendingReview: Number(pendingApps[0]?.count ?? 0),
      approvedApplications: approved,
      rejectedApplications: Number(rejectedApps[0]?.count ?? 0),
      openTickets: Number(openTickets[0]?.count ?? 0),
      revenueThisMonth: Number(revenue[0]?.cents ?? 0),
    };
  }

  async getSettings() {
    const rows = await this.dbClient.db.select().from(systemSettings);
    const settings = structuredClone(DEFAULT_SETTINGS);

    for (const row of rows) {
      if (row.key in settings) {
        (settings as Record<string, unknown>)[row.key] = row.value;
      }
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const current = await this.getSettings();
    const next = {
      ...current,
      ...Object.fromEntries(
        Object.entries(dto).map(([key, value]) => [
          key,
          { ...(current as Record<string, Record<string, unknown>>)[key], ...value },
        ]),
      ),
    };

    for (const [key, value] of Object.entries(next)) {
      await this.dbClient.db
        .insert(systemSettings)
        .values({
          key,
          value,
          description: `${key} settings`,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value, updatedById: userId, updatedAt: new Date() },
        });
    }

    return next;
  }
}
