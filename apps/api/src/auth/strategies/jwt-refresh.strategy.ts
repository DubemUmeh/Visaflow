import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { RequestLike } from '../../common/types/http.types';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'REFRESH_TOKEN_SECRET',
        'CHANGE_ME_REFRESH',
      ),
      passReqToCallback: true,
    });
  }

  validate(req: RequestLike, payload: JwtRefreshPayload) {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }
    return { ...payload, refreshToken };
  }
}
