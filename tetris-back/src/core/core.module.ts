import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Modules
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { MonitoringModule } from './monitoring/monitoring.module';

// Services
import { LoggerService } from './logger/logger.service';

// Interceptors
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { MetricsInterceptor } from './monitoring/metrics.interceptor';

// Filters
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

/**
 * Core Module - Contains all essential infrastructure modules
 * - Logger: Winston-based structured logging
 * - Health Checks: Kubernetes-ready health endpoints
 * - Database: Transaction support and query logging
 * - Monitoring: Prometheus metrics
 * - Exception Filters: Global error handling
 * - Interceptors: Logging, response formatting, performance tracking
 */
@Global()
@Module({
  imports: [
    LoggerModule,
    HealthModule,
    DatabaseModule,
    MonitoringModule,
  ],
  providers: [
    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [
    LoggerModule,
    DatabaseModule,
    MonitoringModule,
  ],
})
export class CoreModule {}

