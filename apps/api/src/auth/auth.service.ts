import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../common/database/database.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { generateSecureToken, sha256 } from '../common/utils/hash';
import { and, eq, gt, isNull, like, sql } from 'drizzle-orm';
import { auditLogs, userSessions, users } from '@visaflow/database';
import { NotificationsService } from '../notifications/notifications.service';
import { type JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

const USER_SELECT = {
  id: users.id,
  email: users.email,
  emailVerified: users.emailVerified,
  emailVerifiedAt: users.emailVerifiedAt,
  phone: users.phone,
  phoneVerified: users.phoneVerified,
  phoneVerifiedAt: users.phoneVerifiedAt,
  passwordHash: users.passwordHash,
  role: users.role,
  authProvider: users.authProvider,
  oauthProviderId: users.oauthProviderId,
  firstName: users.firstName,
  lastName: users.lastName,
  avatarUrl: users.avatarUrl,
  dateOfBirth: users.dateOfBirth,
  nationality: users.nationality,
  passportNumber: users.passportNumber,
  preferredLocale: users.preferredLocale,
  timezone: users.timezone,
  isActive: users.isActive,
  isBanned: users.isBanned,
  bannedAt: users.bannedAt,
  bannedReason: users.bannedReason,
  lastLoginAt: users.lastLoginAt,
  lastLoginIp: users.lastLoginIp,
  loginCount: users.loginCount,
  failedLoginCount: users.failedLoginCount,
  lockedUntil: users.lockedUntil,
  twoFactorEnabled: users.twoFactorEnabled,
  twoFactorSecret: users.twoFactorSecret,
  currentRefreshTokenHash: users.currentRefreshTokenHash,
  deletedAt: users.deletedAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dbClient: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private cleanInput<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const {
      passwordHash,
      twoFactorSecret,
      currentRefreshTokenHash,
      ...safeUser
    } = user;
    return safeUser;
  }

  private async findUserByEmail(email: string) {
    return this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);
  }

  private async findUserById(id: string) {
    return this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);
  }

  async register(dto: RegisterDto) {
    const existing = await this.findUserByEmail(dto.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verificationToken = generateSecureToken();

    const [user] = await this.dbClient.db
      .insert(users)
      .values({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        preferredLocale: dto.preferredLocale ?? 'en',
        nationality: dto.nationality ?? null,
        currentRefreshTokenHash: verificationToken,
      })
      .returning(USER_SELECT);

    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }

    this.logger.log(`New user registered: ${user.email} (${user.id})`);

    await this.notificationsService.createSystemNotification({
      userId: user.id,
      channel: 'IN_APP',
      subject: 'Welcome to VisaFlow',
      body: `Hi ${user.firstName}, your VisaFlow account was created successfully. You can now start a visa application, upload documents, make payments, and track every status update from this notification center.`,
      recipient: user.email,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(eq(users.email, dto.email), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${lockMinutes} minute(s).`,
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      const failedCount = user.failedLoginCount + 1;
      const lockUntil =
        failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.dbClient.db
        .update(users)
        .set({
          failedLoginCount: failedCount,
          lockedUntil: lockUntil,
        })
        .where(eq(users.id, user.id));

      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive || user.isBanned) {
      throw new UnauthorizedException('Account has been disabled');
    }

    await this.dbClient.db
      .update(users)
      .set({
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress ?? null,
        loginCount: sql`${users.loginCount} + 1`,
      })
      .where(eq(users.id, user.id));

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, dto.rememberMe);

    await this.notificationsService.createSystemNotification({
      userId: user.id,
      channel: 'IN_APP',
      subject: 'New sign-in detected',
      body: `Your VisaFlow account was signed in successfully${ipAddress ? ` from IP ${ipAddress}` : ''}. If this was you, no action is needed. If you do not recognize this activity, change your password and contact support immediately.`,
      recipient: user.email,
    });

    await this.dbClient.db
      .insert(auditLogs)
      .values({
        userId: user.id,
        action: 'LOGIN',
        resource: 'user',
        resourceId: user.id,
        ipAddress: ipAddress ?? null,
        metadata: { provider: 'LOCAL' },
      })
      .returning();

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const session = await this.dbClient.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.refreshTokenHash, tokenHash),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.dbClient.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.id, session.id));

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = sha256(refreshToken);
      await this.dbClient.db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(userSessions.userId, userId),
            eq(userSessions.refreshTokenHash, tokenHash),
          ),
        );
    } else {
      await this.dbClient.db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)),
        );
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(eq(users.email, dto.email), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return { message: 'If this email exists, a reset link has been sent' };
    }

    const token = generateSecureToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.dbClient.db
      .update(users)
      .set({
        currentRefreshTokenHash: `reset:${tokenHash}:${expiresAt.toISOString()}`,
      })
      .where(eq(users.id, user.id));

    this.logger.log(`Password reset requested for: ${user.email}`);

    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = sha256(dto.token);
    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(and(like(users.currentRefreshTokenHash, `reset:${tokenHash}:%`)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const expiresAtValue = user.currentRefreshTokenHash?.split(':')[2];
    const expiresAt = expiresAtValue ? new Date(expiresAtValue) : null;
    if (
      !expiresAt ||
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt < new Date()
    ) {
      throw new BadRequestException('Reset token has expired');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.dbClient.db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        currentRefreshTokenHash: null,
      })
      .where(eq(users.id, user.id));

    await this.dbClient.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.userId, user.id));

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const currentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.dbClient.db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, userId));

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(token: string) {
    const tokenHash = sha256(token);

    const user = await this.dbClient.db
      .select(USER_SELECT)
      .from(users)
      .where(
        and(
          like(users.currentRefreshTokenHash, `verify:${tokenHash}:%`),
          eq(users.emailVerified, false),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      throw new BadRequestException(
        'Invalid or already used verification token',
      );
    }

    await this.dbClient.db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        currentRefreshTokenHash: null,
      })
      .where(eq(users.id, user.id));

    return { message: 'Email verified successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer' as const,
    };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    rememberMe = false,
  ) {
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    );

    await this.dbClient.db
      .insert(userSessions)
      .values({ userId, refreshTokenHash: tokenHash, expiresAt })
      .returning();
  }
}
