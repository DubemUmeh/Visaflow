import { IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListWalletTransactionsDto extends PaginationDto {}

export class DepositWebhookDto {
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  transactionHash!: string;

  @IsString()
  recipient!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsInt()
  @Min(0)
  confirmations!: number;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  asset?: string;
}

export class PayWithWalletDto {
  @IsUUID()
  applicationId!: string;

  @IsString()
  processingTier!: 'STANDARD' | 'EXPEDITED' | 'RUSH';
}
