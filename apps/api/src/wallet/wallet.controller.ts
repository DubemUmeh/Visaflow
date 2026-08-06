import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DepositWebhookDto, ListWalletTransactionsDto, PayWithWalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';

type CurrentUserShape = { id: string; role?: string };

@ApiTags('wallet')
@ApiBearerAuth('JWT')
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get current wallet' })
  getWallet(@CurrentUser('id') userId: string) { return this.walletService.getWallet(userId); }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  async balance(@CurrentUser('id') userId: string) { const wallet = await this.walletService.getWallet(userId); return { balance: wallet.balance, currency: wallet.currency }; }

  @UseGuards(JwtAuthGuard)
  @Get('deposit-address')
  @ApiOperation({ summary: 'Get assigned deposit address' })
  address(@CurrentUser('id') userId: string) { return this.walletService.getDepositAddress(userId); }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  transactions(@CurrentUser('id') userId: string, @Query() query: ListWalletTransactionsDto) { return this.walletService.listTransactions(userId, query); }

  @UseGuards(JwtAuthGuard)
  @Get('deposits')
  @ApiOperation({ summary: 'List wallet deposits' })
  deposits(@CurrentUser('id') userId: string) { return this.walletService.listDeposits(userId); }

  @UseGuards(JwtAuthGuard)
  @Post('pay')
  @ApiOperation({ summary: 'Pay for an application with wallet balance' })
  pay(@CurrentUser() user: CurrentUserShape, @Body() dto: PayWithWalletDto) { return this.walletService.payWithWallet(user.id, user.role, dto); }

  @Post('webhooks/deposit')
  @ApiOperation({ summary: 'Blockchain provider deposit webhook' })
  webhook(@Body() dto: DepositWebhookDto) { return this.walletService.handleDepositWebhook(dto); }
}
