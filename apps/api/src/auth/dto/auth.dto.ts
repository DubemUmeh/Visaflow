import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  lastName!: string;

  @ApiPropertyOptional({ example: '+12025551234' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @ApiPropertyOptional({
    enum: ['en', 'es', 'fr', 'pt', 'ar', 'zh'],
    default: 'en',
  })
  @IsOptional()
  @IsString()
  preferredLocale?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  nationality?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  newPassword!: string;

  @ApiProperty()
  @IsString()
  confirmPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  newPassword!: string;

  @ApiProperty()
  @IsString()
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshToken?: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'Code must be numeric' })
  code!: string;
}

export class OAuthCallbackDto {
  @ApiProperty({ enum: ['google', 'apple'] })
  @IsString()
  provider!: 'google' | 'apple';

  @ApiProperty()
  @IsString()
  idToken!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;
}
