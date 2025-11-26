import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, UserPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from 'src/prisma.service';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          return request?.cookies?.['refresh_token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_REFRESH_SECRET',
        'your-refresh-secret-key',
      ),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<UserPayload> {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Extract the token from the request
    const token =
      ExtractJwt.fromAuthHeaderAsBearerToken()(req) ||
      req.cookies?.['refresh_token'];

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Verify token exists and is not revoked
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            roles: true,
            isActive: true,
            isEmailVerified: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    if (!refreshToken || refreshToken.isRevoked) {
      // Potential token reuse - revoke all tokens in the family
      if (refreshToken && payload.tokenFamily) {
        await this.prisma.refreshToken.updateMany({
          where: { tokenFamily: payload.tokenFamily },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException(
        'Refresh token revoked or invalid - possible token reuse detected',
      );
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!refreshToken.user || !refreshToken.user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Attach token to request for rotation
    req['refreshToken'] = refreshToken;

    return {
      id: refreshToken.user.id,
      email: refreshToken.user.email,
      roles: refreshToken.user.roles,
      isEmailVerified: refreshToken.user.isEmailVerified,
      twoFactorEnabled: refreshToken.user.twoFactorEnabled,
    };
  }
}

