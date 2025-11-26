import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Check if IP has exceeded rate limit
   * @param key - Unique key (e.g., IP address, user ID)
   * @param limit - Maximum number of requests
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded
   */
  async isRateLimited(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean> {
    const redisKey = `rate-limit:${key}`;
    const client = this.redis.client;

    const current = await client.incr(redisKey);

    if (current === 1) {
      // First request, set expiration
      await client.pexpire(redisKey, windowMs);
    }

    return current > limit;
  }

  //Obtener las solicitudes restantes para una clave
  async getRemainingRequests(
    key: string,
    limit: number,
  ): Promise<{ remaining: number; reset: number }> {
    const redisKey = `rate-limit:${key}`;
    const client = this.redis.client;

    const current = (await client.get(redisKey)) || '0';
    const ttl = (await client.pttl(redisKey)) || 0;

    const remaining = Math.max(0, limit - parseInt(current, 10));
    const reset = Date.now() + ttl;

    return { remaining, reset };
  }

  //Reiniciar el límite de solicitudes para una clave
  async reset(key: string): Promise<void> {
    const redisKey = `rate-limit:${key}`;
    await this.redis.client.del(redisKey);
  }
}

