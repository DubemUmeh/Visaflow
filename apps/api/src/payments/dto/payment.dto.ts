import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
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
  @IsIn(['stripe', 'paypal'])
  provider?: 'stripe' | 'paypal';
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
