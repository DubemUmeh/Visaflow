import { IsIn, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateCheckoutSessionDto {
  @IsUUID()
  applicationId!: string;

  @IsIn(['STANDARD', 'EXPEDITED', 'RUSH'])
  processingTier!: 'STANDARD' | 'EXPEDITED' | 'RUSH';

  @IsOptional()
  @IsString()
  currency?: string;

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;

  @IsOptional()
  @IsIn(['stripe', 'paypal', 'crypto_wallet_connect', 'crypto_wallet_address'])
  provider?:
    | 'stripe'
    | 'paypal'
    | 'crypto_wallet_connect'
    | 'crypto_wallet_address';

  @IsOptional()
  @IsString()
  walletId?: string;
}

export class ListPaymentsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

export class MarkPaymentPaidDto {
  @IsOptional()
  @IsString()
  providerPaymentId?: string;
}
