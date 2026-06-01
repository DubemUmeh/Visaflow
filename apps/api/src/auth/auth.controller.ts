import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
  LogoutDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestLike } from '../common/types/http.types';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Public Routes ─────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: RequestLike) {
    const ip = req.ip ?? req.socket.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: RequestLike) {
    // Extract userId from the refresh token payload without full validation
    const payload = this.extractRefreshPayload(dto.refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token format');
    }
    return this.authService.refreshTokens(payload.sub, dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ── Protected Routes ──────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: LogoutDto,
  ) {
    await this.authService.logout(userId, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: unknown) {
    return { user };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private extractRefreshPayload(token: string): { sub: string } | null {
    try {
      const parts = token.split('.');
      const payloadSegment = parts[1];
      if (parts.length !== 3 || !payloadSegment) return null;
      const decoded = JSON.parse(
        Buffer.from(payloadSegment, 'base64url').toString('utf-8'),
      ) as { sub?: unknown };
      return typeof decoded.sub === 'string' ? { sub: decoded.sub } : null;
    } catch {
      return null;
    }
  }
}
