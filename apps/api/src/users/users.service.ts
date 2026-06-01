import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { and, desc, eq, ilike, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { users } from '@visaflow/database';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  preferredLocale?: string;
  timezone?: string;
}

const USER_SELECT = {
  id: users.id,
  email: users.email,
  emailVerified: users.emailVerified,
  phone: users.phone,
  phoneVerified: users.phoneVerified,
  role: users.role,
  firstName: users.firstName,
  lastName: users.lastName,
  avatarUrl: users.avatarUrl,
  dateOfBirth: users.dateOfBirth,
  nationality: users.nationality,
  passportNumber: users.passportNumber,
  preferredLocale: users.preferredLocale,
  timezone: users.timezone,
  isActive: users.isActive,
  isBanned: users.isBanned,
  twoFactorEnabled: users.twoFactorEnabled,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly dbClient: DatabaseService) {}

  async findById(id: string) {
    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    if (data.phone) {
      const existing = await this.dbClient.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.phone, data.phone),
            ne(users.id, userId),
            isNull(users.deletedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (existing) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const updateData: Record<string, unknown> = {
      ...data,
    };

    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    } else {
      delete updateData.dateOfBirth;
    }

    await this.dbClient.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return this.findById(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.dbClient.db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId));

    return this.findById(userId);
  }

  async deleteAccount(userId: string) {
    await this.dbClient.db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: `deleted_${userId}@visaflow.deleted`,
        isActive: false,
      })
      .where(eq(users.id, userId));
  }

  // ── Admin Operations ──────────────────────────────────────────────────────

  async adminListUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, role, isActive } = params;
    const { skip, take } = buildPaginationSkipTake(page, limit);

    const where = and(
      isNull(users.deletedAt),
      search
        ? or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
          )
        : undefined,
      role ? eq(users.role, role as any) : undefined,
      isActive !== undefined ? eq(users.isActive, isActive) : undefined,
    ) as SQL;

    const [userRows, countRows] = await Promise.all([
      this.dbClient.db
        .select(USER_SELECT)
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(where),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    return {
      data: userRows,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async adminUpdateUser(
    userId: string,
    data: {
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
      bannedReason?: string;
    },
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.role) {
      updateData.role = data.role;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.isBanned !== undefined) {
      updateData.isBanned = data.isBanned;
      updateData.bannedAt = data.isBanned ? new Date() : null;
      updateData.bannedReason = data.bannedReason ?? null;
    }

    await this.dbClient.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return this.findById(userId);
  }
}
