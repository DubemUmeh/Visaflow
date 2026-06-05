import {
  IsIn,
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const documentTypes = [
  'PASSPORT_PHOTO',
  'PASSPORT_COPY',
  'BANK_STATEMENT',
  'INVITATION_LETTER',
  'TRAVEL_ITINERARY',
  'HOTEL_BOOKING',
  'FLIGHT_ITINERARY',
  'EMPLOYMENT_LETTER',
  'FINANCIAL_PROOF',
  'BIRTH_CERTIFICATE',
  'MARRIAGE_CERTIFICATE',
  'TRAVEL_INSURANCE',
  'YELLOW_FEVER_CERT',
  'BUSINESS_REGISTRATION',
  'VISA_FOR_DESTINATION',
  'OTHER'
] as const;

const documentStatuses = [
  'PENDING',
  'UPLOADING',
  'PROCESSING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;

export class RequestUploadUrlDto {
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsIn(documentTypes)
  documentType!: (typeof documentTypes)[number];

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsMimeType()
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  sizeBytes!: number;
}

export class ConfirmUploadDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsString()
  storageKey?: string;
}

export class ListDocumentsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsIn(documentTypes)
  documentType?: (typeof documentTypes)[number];

  @IsOptional()
  @IsIn(documentStatuses)
  status?: (typeof documentStatuses)[number];
}

export class ReviewDocumentDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
