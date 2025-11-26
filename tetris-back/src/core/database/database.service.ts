import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('DatabaseService');
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;

        if (duration > 1000) {
          this.logger.warn(
            `Slow query detected: ${params.model}.${params.action} took ${duration}ms`,
            'Database',
          );
        }

        if (duration > 100) {
          this.logger.logDatabaseQuery(
            `${params.model}.${params.action}`,
            duration,
          );
        }

        return result;
      });
    }
  }

  /**
   * Execute operations in a transaction
   */
  async transaction<T>(
    fn: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: any;
    },
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$transaction(fn, options);
      const duration = Date.now() - startTime;
      
      this.logger.debug(
        `Transaction completed in ${duration}ms`,
        'Database',
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Transaction failed after ${duration}ms: ${error.message}`,
        error.stack,
        'Database',
      );
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw(query: string, values?: any[]) {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$executeRawUnsafe(query, ...values);
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseQuery(query, duration);
      
      return result;
    } catch (error) {
      this.logger.error(
        `Raw query failed: ${error.message}`,
        error.stack,
        'Database',
      );
      throw error;
    }
  }

  /**
   * Query raw SQL
   */
  async queryRaw<T = any>(query: string, values?: any[]): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$queryRawUnsafe<T[]>(query, ...values);
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseQuery(query, duration);
      
      return result;
    } catch (error) {
      this.logger.error(
        `Raw query failed: ${error.message}`,
        error.stack,
        'Database',
      );
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error.stack,
        'Database',
      );
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const stats = await this.prisma.$metrics.json();
      return stats;
    } catch (error) {
      this.logger.warn(
        'Failed to get database stats',
        'Database',
      );
      return null;
    }
  }
}

