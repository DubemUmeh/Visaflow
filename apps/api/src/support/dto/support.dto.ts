import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(3)
  body!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsIn(priorities)
  priority?: (typeof priorities)[number];

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}

export class ReplySupportTicketDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];
}

export class ListSupportTicketsDto extends PaginationDto {
  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];
}

export class AdminUpdateTicketDto {
  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsIn(priorities)
  priority?: (typeof priorities)[number];

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  isInternal?: boolean;
}
