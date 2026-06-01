import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateCheckoutSessionDto,
  ListPaymentsDto,
  MarkPaymentPaidDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';

type CurrentUserShape = { id: string; role?: string };

@ApiTags('payments')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create checkout session for an application' })
  async createCheckout(
    @CurrentUser() user: CurrentUserShape,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckout(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async listPayments(@CurrentUser() user: CurrentUserShape, @Query() query: ListPaymentsDto) {
    return this.paymentsService.findAll({
      userId: user.id,
      role: user.role,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      applicationId: query.applicationId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async getPayment(@CurrentUser() user: CurrentUserShape, @Param('id') id: string) {
    return this.paymentsService.findById(id, user.id, user.role);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: '[Admin] Mark a payment as paid' })
  async markPaid(
    @CurrentUser() user: CurrentUserShape,
    @Param('id') id: string,
    @Body() dto: MarkPaymentPaidDto,
  ) {
    return this.paymentsService.markPaid(id, user.id, user.role, dto);
  }
}
