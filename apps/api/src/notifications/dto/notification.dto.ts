import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListNotificationsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['EMAIL', 'SMS', 'IN_APP', 'PUSH'])
  channel?: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

  @IsOptional()
  isRead?: boolean;
}

export class MarkNotificationsReadDto {
  @IsArray()
  notificationIds!: string[];
}

export class DeleteNotificationsDto {
  @IsArray()
  notificationIds!: string[];
}

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsIn(['EMAIL', 'SMS', 'IN_APP', 'PUSH'])
  channel!: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body!: string;

  @IsString()
  recipient!: string;
}
