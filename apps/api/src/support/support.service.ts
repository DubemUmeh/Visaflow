import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, sql, type InferModel } from 'drizzle-orm';
import {
  supportMessages,
  supportTickets,
  users,
} from '@visaflow/database';
import type { SupportMessageEntity, SupportTicketEntity } from '@visaflow/shared-types';
import { DatabaseService } from '../common/database/database.service';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import { generateTicketNumber } from '../common/utils/reference-generator';
import type {
  AdminUpdateTicketDto,
  CreateSupportTicketDto,
  ListSupportTicketsDto,
  ReplySupportTicketDto,
} from './dto/support.dto';

type TicketRow = InferModel<typeof supportTickets>;
type MessageRow = InferModel<typeof supportMessages>;

@Injectable()
export class SupportService {
  constructor(private readonly dbClient: DatabaseService) {}

  private isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'AGENT';
  }

  private toIso(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private async messageAuthor(authorId: string | null) {
    if (!authorId) return null;
    const [author] = await this.dbClient.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);
    return author ?? null;
  }

  private async toMessage(row: MessageRow): Promise<SupportMessageEntity> {
    return {
      id: row.id,
      ticketId: row.ticketId,
      authorId: row.authorId,
      isInternal: row.isInternal,
      body: row.body,
      attachments: (row.attachments as unknown[]) ?? [],
      author: await this.messageAuthor(row.authorId),
      createdAt: this.toIso(row.createdAt) ?? '',
    };
  }

  private async toEntity(ticket: TicketRow, includeInternal: boolean): Promise<SupportTicketEntity> {
    const messageRows = await this.dbClient.db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticket.id))
      .orderBy(desc(supportMessages.createdAt));

    const visibleMessages = includeInternal
      ? messageRows
      : messageRows.filter((message) => !message.isInternal);

    return {
      id: ticket.id,
      userId: ticket.userId,
      applicationId: ticket.applicationId,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      resolvedAt: this.toIso(ticket.resolvedAt),
      createdAt: this.toIso(ticket.createdAt) ?? '',
      messages: await Promise.all(visibleMessages.map((message) => this.toMessage(message))),
    };
  }

  private async findTicketRow(id: string, userId: string, role?: string) {
    const [ticket] = await this.dbClient.db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), isNull(supportTickets.deletedAt)))
      .limit(1);

    if (!ticket) throw new NotFoundException('Support ticket not found');
    if (!this.isAdmin(role) && ticket.userId !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    return ticket;
  }

  async create(userId: string | null, dto: CreateSupportTicketDto) {
    const [ticket] = await this.dbClient.db
      .insert(supportTickets)
      .values({
        userId,
        applicationId: dto.applicationId ?? null,
        ticketNumber: generateTicketNumber(),
        subject: dto.subject,
        status: 'OPEN',
        priority: dto.priority ?? 'MEDIUM',
        category: dto.category ?? 'general',
        guestEmail: dto.guestEmail ?? null,
        guestName: dto.guestName ?? null,
      })
      .returning();

    if (!ticket) throw new NotFoundException('Support ticket could not be created');

    await this.dbClient.db.insert(supportMessages).values({
      ticketId: ticket.id,
      authorId: userId,
      body: dto.body,
      isInternal: false,
      attachments: [],
    });

    return this.toEntity(ticket, true);
  }

  async findAll(userId: string, role: string | undefined, query: ListSupportTicketsDto) {
    const { skip, take } = buildPaginationSkipTake(query.page ?? 1, query.limit ?? 20);
    const conditions = [
      isNull(supportTickets.deletedAt),
      this.isAdmin(role) ? undefined : eq(supportTickets.userId, userId),
      query.status ? eq(supportTickets.status, query.status) : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];
    const where = and(...conditions);

    const [rows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(supportTickets)
        .where(where)
        .orderBy(desc(supportTickets.createdAt))
        .limit(take)
        .offset(skip),
      this.dbClient.db.select({ count: sql`count(*)` }).from(supportTickets).where(where),
    ]);

    return {
      data: await Promise.all(rows.map((ticket) => this.toEntity(ticket, this.isAdmin(role)))),
      meta: buildPaginationMeta(Number(countRows[0]?.count ?? 0), query.page ?? 1, query.limit ?? 20),
    };
  }

  async findById(id: string, userId: string, role?: string) {
    return this.toEntity(await this.findTicketRow(id, userId, role), this.isAdmin(role));
  }

  async reply(id: string, userId: string, role: string | undefined, dto: ReplySupportTicketDto) {
    const ticket = await this.findTicketRow(id, userId, role);

    await this.dbClient.db.insert(supportMessages).values({
      ticketId: ticket.id,
      authorId: userId,
      body: dto.body,
      isInternal: false,
      attachments: dto.attachments ?? [],
    });

    await this.dbClient.db
      .update(supportTickets)
      .set({ status: this.isAdmin(role) ? 'WAITING_ON_CUSTOMER' : 'OPEN' })
      .where(eq(supportTickets.id, id));

    return this.findById(id, userId, role);
  }

  async adminUpdate(id: string, userId: string, role: string | undefined, dto: AdminUpdateTicketDto) {
    if (!this.isAdmin(role)) throw new ForbiddenException('Only support staff can update tickets');
    await this.findTicketRow(id, userId, role);

    await this.dbClient.db
      .update(supportTickets)
      .set({
        status: dto.status,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        resolvedAt: dto.status === 'RESOLVED' ? new Date() : undefined,
        closedAt: dto.status === 'CLOSED' ? new Date() : undefined,
      })
      .where(eq(supportTickets.id, id));

    if (dto.body) {
      await this.dbClient.db.insert(supportMessages).values({
        ticketId: id,
        authorId: userId,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
        attachments: [],
      });
    }

    return this.findById(id, userId, role);
  }
}
