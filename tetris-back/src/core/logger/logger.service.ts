import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context: string;

  constructor(private configService?: ConfigService) {
    this.context = 'Application';
    this.initializeLogger();
  }

  private initializeLogger() {
    const env = this.configService?.get('NODE_ENV') || 'development';
    const logLevel = this.configService?.get('LOG_LEVEL') || 'info';

    // Custom format
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata(),
      winston.format.json(),
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const contextStr = context ? `[${context}]` : '';
        const traceStr = trace ? `\n${trace}` : '';
        return `${timestamp} ${level} ${contextStr} ${message}${traceStr}`;
      }),
    );

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: env === 'production' ? customFormat : consoleFormat,
      }),
    ];

    // File transports for production
    if (env === 'production') {
      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: customFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          format: customFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      );

      // Warning logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/warn-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'warn',
          format: customFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      exitOnError: false,
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Additional custom methods
  http(message: string, meta?: any) {
    this.logger.http(message, { ...meta, context: this.context });
  }

  logRequest(req: any) {
    this.logger.http('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      context: 'HTTP',
    });
  }

  logResponse(req: any, res: any, responseTime: number) {
    this.logger.http('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      context: 'HTTP',
    });
  }

  logDatabaseQuery(query: string, duration: number) {
    this.logger.debug('Database query executed', {
      query,
      duration: `${duration}ms`,
      context: 'Database',
    });
  }

  logSecurityEvent(event: string, details: any) {
    this.logger.warn('Security event', {
      event,
      ...details,
      context: 'Security',
    });
  }

  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.info('Performance metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
      context: 'Performance',
    });
  }
}

