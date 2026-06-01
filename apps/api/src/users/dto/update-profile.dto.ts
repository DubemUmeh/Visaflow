import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({ example: '+12025551234' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  nationality?: string;

  @ApiPropertyOptional({ example: 'A1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  passportNumber?: string;

  @ApiPropertyOptional({ enum: ['en', 'es', 'fr', 'pt', 'ar', 'zh'] })
  @IsOptional()
  @IsIn(['en', 'es', 'fr', 'pt', 'ar', 'zh'])
  preferredLocale?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
