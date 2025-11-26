import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { AuthProvider } from 'generated/prisma/client';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3000/auth/github/callback',
      ),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, emails, displayName } = profile;

    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('No email found in GitHub profile'), null);
    }

    const [firstName, ...lastNameParts] = displayName?.split(' ') || [];

    const user = await this.authService.findOrCreateOAuthUser({
      email,
      providerId: id,
      provider: AuthProvider.GITHUB,
      firstName: firstName || undefined,
      lastName: lastNameParts.join(' ') || undefined,
    });

    done(null, user);
  }
}

