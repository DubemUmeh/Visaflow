import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateNotificationDto,
  ListNotificationsDto,
  MarkNotificationsReadDto,
  DeleteNotificationsDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

type CurrentUserShape = { id: string; role?: string };

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async list(@CurrentUser() user: CurrentUserShape, @Query() query: ListNotificationsDto) {
    return this.notificationsService.findAll(user.id, user.role, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  async markRead(
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    return this.notificationsService.markRead(user.id, user.role, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete notifications' })
  async delete(
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: DeleteNotificationsDto,
  ) {
    return this.notificationsService.delete(user.id, user.role, dto);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create notification' })
  async create(@CurrentUser('role') role: string, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(role, dto);
  }
}
