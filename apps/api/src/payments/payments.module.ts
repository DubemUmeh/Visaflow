import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WalletConnectService } from './walletconnect.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, WalletConnectService],
})
export class PaymentsModule {}
