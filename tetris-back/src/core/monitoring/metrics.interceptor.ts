import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const route = request.route?.path || request.url;
        
        this.metricsService.recordHttpRequest(
          request.method,
          route,
          response.statusCode,
          duration,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const route = request.route?.path || request.url;
        
        this.metricsService.recordHttpRequest(
          request.method,
          route,
          error.status || 500,
          duration,
        );
        
        this.metricsService.recordHttpError(
          request.method,
          route,
          error.name || 'UnknownError',
        );
        
        throw error;
      }),
    );
  }
}

