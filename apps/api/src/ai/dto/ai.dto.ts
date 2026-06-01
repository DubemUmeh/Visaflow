import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AiAutofillDto {
  @IsString()
  @MinLength(4)
  @MaxLength(2000)
  prompt!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  visaName!: string;
}

export class AiRequirementSummaryDto {
  @IsUUID()
  visaTypeId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  nationalityCode!: string;
}

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
