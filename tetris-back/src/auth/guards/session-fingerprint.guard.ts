import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from 'src/redis.service';
import { createHash } from 'crypto';


@Injectable()
export class SessionFingerprintGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userAgent = request.headers['user-agent'];
    const ipAddress = this.getClientIp(request);

    // Create a fingerprint hash
    const fingerprint = this.createFingerprint(userAgent, ipAddress);

    // Check stored fingerprint in Redis
    const storedFingerprint = await this.redis.get(
      `session:${user.id}:fingerprint`,
    );

    if (storedFingerprint && storedFingerprint !== fingerprint) {
      throw new UnauthorizedException(
        'Session fingerprint mismatch - possible session hijacking',
      );
    }

    await this.redis.set(
      `session:${user.id}:fingerprint`,
      fingerprint,
      3600, // 1 hour
    );

    return true;
  }

  private createFingerprint(userAgent: string, ipAddress: string): string {
    return createHash('sha256')
      .update(`${userAgent}:${ipAddress}`)
      .digest('hex');
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}

