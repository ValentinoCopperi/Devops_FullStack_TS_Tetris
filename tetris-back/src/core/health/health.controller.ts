import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/auth/decorators/public.decorator';
import { PrismaService } from 'src/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    private prismaService: PrismaService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database check
      () => this.prisma.pingCheck('database', this.prismaService),
      
      // Redis check
      () => this.redis.isHealthy('redis'),
      
      // Memory check - heap should not use more than 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      
      // Memory check - RSS should not use more than 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // Disk storage check - should have at least 50% free space
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.5,
        }),
    ]);
  }

  @Get('liveness')
  @Public()
  @HealthCheck()
  checkLiveness() {
    // Simple liveness check - just checks if the app is running
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  checkReadiness() {
    // Readiness check - checks if app is ready to accept traffic
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('startup')
  @Public()
  @HealthCheck()
  checkStartup() {
    // Startup check - verifies app has started correctly
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}

