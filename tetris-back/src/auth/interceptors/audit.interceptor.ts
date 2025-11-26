import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { AuditService } from '../services/audit.service';

//Interceptor para auditar las operaciones sensibles
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url } = request;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    const action = this.getActionFromRequest(method, url);

    if (!action) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - startTime;
        await this.auditService.log({
          userId: user?.id,
          action,
          resource: 'auth',
          details: `${method} ${url} - ${duration}ms`,
          ipAddress,
          userAgent,
          success: true,
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        await this.auditService.log({
          userId: user?.id,
          action,
          resource: 'auth',
          details: `${method} ${url} - ${duration}ms - Error: ${error.message}`,
          ipAddress,
          userAgent,
          success: false,
        });
        throw error;
      }),
    );
  }

  private getActionFromRequest(method: string, url: string): string | null {
    const auditableRoutes = [
      { pattern: /\/auth\/login/, action: 'LOGIN_ATTEMPT' },
      { pattern: /\/auth\/register/, action: 'REGISTER_ATTEMPT' },
      { pattern: /\/auth\/2fa/, action: '2FA_OPERATION' },
      { pattern: /\/auth\/reset-password/, action: 'PASSWORD_RESET' },
      { pattern: /\/auth\/revoke-all/, action: 'TOKENS_REVOKED' },
    ];

    for (const route of auditableRoutes) {
      if (route.pattern.test(url)) {
        return route.action;
      }
    }

    return null;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}

