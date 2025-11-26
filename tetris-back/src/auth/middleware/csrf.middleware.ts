import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly excludedMethods = ['GET', 'HEAD', 'OPTIONS'];
  private readonly excludedPaths = [
    '/auth/google',
    '/auth/google/callback',
    '/auth/github',
    '/auth/github/callback',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods and excluded paths
    if (
      this.excludedMethods.includes(req.method) ||
      this.excludedPaths.some((path) => req.path.startsWith(path))
    ) {
      return next();
    }

    const token = req.headers['x-csrf-token'] as string;
    const cookieToken = req.cookies?.['csrf_token'];

    if (!token || !cookieToken || token !== cookieToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  /**
   * Generate CSRF token and set cookie
   */
  static generateToken(res: Response): string {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');

    res.cookie('csrf_token', hash, {
      httpOnly: false, // Needs to be readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return hash;
  }
}

