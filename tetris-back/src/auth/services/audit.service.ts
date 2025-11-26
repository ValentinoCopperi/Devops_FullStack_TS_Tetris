import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error}`);
    }
  }

  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getFailedLoginAttempts(userId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        success: false,
        createdAt: { gte: since },
      },
    });
  }

  async getSecurityEvents(userId: string, limit: number = 20) {
    const securityActions = [
      'LOGIN_FAILED',
      'PASSWORD_RESET',
      '2FA_ENABLED',
      '2FA_DISABLED',
      'TOKENS_REVOKED',
      'ACCOUNT_LOCKED',
    ];

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: { in: securityActions },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

