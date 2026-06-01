import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AdminUpdateTicketDto,
  CreateSupportTicketDto,
  ListSupportTicketsDto,
  ReplySupportTicketDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

type CurrentUserShape = { id: string; role?: string };

@ApiTags('support')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'support', version: '1' })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(@CurrentUser('id') userId: string, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.create(userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets' })
  async listTickets(@CurrentUser() user: CurrentUserShape, @Query() query: ListSupportTicketsDto) {
    return this.supportService.findAll(user.id, user.role, query);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  async getTicket(@CurrentUser() user: CurrentUserShape, @Param('id') id: string) {
    return this.supportService.findById(id, user.id, user.role);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to support ticket' })
  async reply(
    @CurrentUser() user: CurrentUserShape,
    @Param('id') id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.supportService.reply(id, user.id, user.role, dto);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: '[Admin] Update support ticket' })
  async adminUpdate(
    @CurrentUser() user: CurrentUserShape,
    @Param('id') id: string,
    @Body() dto: AdminUpdateTicketDto,
  ) {
    return this.supportService.adminUpdate(id, user.id, user.role, dto);
  }
}
