import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from 'src/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redisService.client.ping();
      const isHealthy = pong === 'PONG';

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Redis is up' : 'Redis is down',
      });

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Redis health check failed', result);
    } catch (error) {
      throw new HealthCheckError('Redis health check failed', {
        redis: {
          status: 'down',
          message: error.message,
        },
      });
    }
  }
}

