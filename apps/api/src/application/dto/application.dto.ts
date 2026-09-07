import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const applicationStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'MISSING_DOCUMENTS',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
] as const;

export class CreateApplicationDto {
  @IsUUID()
  visaTypeId!: string;

  @IsOptional()
  @IsUUID()
  destinationCountryId?: string;

  @IsOptional()
  @IsUUID()
  nationalityCountryId?: string;

  @IsOptional()
  @IsIn(['STANDARD', 'EXPEDITED', 'RUSH'])
  processingTier?: 'STANDARD' | 'EXPEDITED' | 'RUSH';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  applicantFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  applicantLastName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  applicantEmail?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  applicantPhone?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  applicantDob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  applicantPassportNo?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  applicantPassportExpiry?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  travelDateFrom?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  travelDateTo?: string;

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}

export class ListApplicationsDto extends PaginationDto {
  @IsOptional()
  @IsIn(applicationStatuses)
  status?: (typeof applicationStatuses)[number];

  @IsOptional()
  @IsUUID()
  destinationCountryId?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsIn(['STANDARD', 'EXPEDITED', 'RUSH'])
  processingTier?: 'STANDARD' | 'EXPEDITED' | 'RUSH';

  @IsOptional()
  @IsUUID()
  destinationCountryId?: string;

  @IsOptional()
  @IsUUID()
  nationalityCountryId?: string;

  @IsOptional()
  @IsUUID()
  visaTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicantFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicantLastName?: string;

  @IsOptional()
  @IsEmail()
  applicantEmail?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  travelDateFrom?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  travelDateTo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  applicantPhone?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  applicantDob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  applicantPassportNo?: string;

  @IsOptional()
  @Matches(isoDatePattern)
  applicantPassportExpiry?: string;

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class UpdateApplicationStatusDto {
  @IsIn(applicationStatuses)
  status!: (typeof applicationStatuses)[number];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  missingDocumentsNote?: string;
}
