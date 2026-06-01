import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database/database.service';
import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@visaflow/database';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  jti?: string; // JWT ID for revocation
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly dbClient: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'CHANGE_ME_IN_PRODUCTION',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.dbClient.db
      .select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        phone: users.phone,
        phoneVerified: users.phoneVerified,
        role: users.role,
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
        twoFactorEnabled: users.twoFactorEnabled,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, payload.sub), isNull(users.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive || user.isBanned) {
      throw new UnauthorizedException('Account is disabled');
    }

    return user;
  }
}
