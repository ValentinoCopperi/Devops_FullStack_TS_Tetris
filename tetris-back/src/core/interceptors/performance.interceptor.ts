import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('Performance');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // Log performance metrics
        this.logger.logPerformance(`${method} ${url}`, duration, {
          controller: context.getClass().name,
          handler: context.getHandler().name,
        });

        // Alert on critical slow endpoints
        if (duration > 5000) {
          this.logger.error(
            `Critical: Endpoint ${method} ${url} took ${duration}ms`,
            undefined,
            'Performance',
          );
        } else if (duration > 2000) {
          this.logger.warn(
            `Warning: Endpoint ${method} ${url} took ${duration}ms`,
            'Performance',
          );
        }
      }),
    );
  }
}

