import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull, isNull, sql, type InferModel } from 'drizzle-orm';
import { notifications } from '@visaflow/database';
import type { NotificationEntity } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import type {
  CreateNotificationDto,
  ListNotificationsDto,
  MarkNotificationsReadDto,
  DeleteNotificationsDto,
} from './dto/notification.dto';

type NotificationRow = InferModel<typeof notifications>;

@Injectable()
export class NotificationsService {
  constructor(private readonly dbClient: DatabaseService) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private toEntity(row: NotificationRow): NotificationEntity {
    return {
      id: row.id,
      userId: row.userId,
      applicationId: row.applicationId,
      channel: row.channel,
      status: row.status,
      subject: row.subject,
      body: row.body,
      readAt: this.toIso(row.readAt),
      createdAt: this.toIso(row.createdAt) ?? '',
    };
  }

  async create(role: string | undefined, dto: CreateNotificationDto) {
    if (!this.isAdmin(role)) throw new ForbiddenException('Only admins can create notifications');

    const [notification] = await this.dbClient.db
      .insert(notifications)
      .values({
        userId: dto.userId,
        applicationId: dto.applicationId ?? null,
        channel: dto.channel,
        status: dto.channel === 'IN_APP' ? 'DELIVERED' : 'QUEUED',
        subject: dto.subject ?? null,
        body: dto.body,
        recipient: dto.recipient,
        templateData: {},
      })
      .returning();

    return notification ? this.toEntity(notification) : null;
  }

  async findAll(userId: string, role: string | undefined, query: ListNotificationsDto) {
    const { skip, take } = buildPaginationSkipTake(query.page ?? 1, query.limit ?? 20);
    const conditions = [
      this.isAdmin(role) ? undefined : eq(notifications.userId, userId),
      query.channel ? eq(notifications.channel, query.channel) : undefined,
      query.isRead === true ? isNotNull(notifications.readAt) : undefined,
      query.isRead === false ? isNull(notifications.readAt) : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db.select({ count: sql`count(*)` }).from(notifications).where(where),
    ]);

    return {
      data: rows.map((row) => this.toEntity(row)),
      meta: buildPaginationMeta(Number(countRows[0]?.count ?? 0), query.page ?? 1, query.limit ?? 20),
    };
  }

  async unreadCount(userId: string) {
    const [row] = await this.dbClient.db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return { count: Number(row?.count ?? 0) };
  }


  async delete(userId: string, role: string | undefined, dto: DeleteNotificationsDto) {
    const baseConditions = [
      this.isAdmin(role) ? undefined : eq(notifications.userId, userId),
      dto.notificationIds.length ? inArray(notifications.id, dto.notificationIds) : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];

    await this.dbClient.db
      .delete(notifications)
      .where(baseConditions.length ? and(...baseConditions) : eq(notifications.userId, userId));

    return this.unreadCount(userId);
  }

  async markRead(userId: string, role: string | undefined, dto: MarkNotificationsReadDto) {
    const baseConditions = [
      this.isAdmin(role) ? undefined : eq(notifications.userId, userId),
      dto.notificationIds.length ? inArray(notifications.id, dto.notificationIds) : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];

    await this.dbClient.db
      .update(notifications)
      .set({ readAt: new Date(), status: 'READ' })
      .where(baseConditions.length ? and(...baseConditions) : eq(notifications.userId, userId));

    return this.unreadCount(userId);
  }
}
