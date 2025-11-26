import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: any = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Handle different response types
    if (typeof exceptionResponse === 'string') {
      errorResponse.message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      errorResponse.message =
        (exceptionResponse as any).message || exception.message;
      errorResponse.error = (exceptionResponse as any).error;
      
      // Include validation errors if present
      if ((exceptionResponse as any).errors) {
        errorResponse.errors = (exceptionResponse as any).errors;
      }
    }

    // Log the error
    this.logger.error(
      `HTTP ${status} Error: ${errorResponse.message}`,
      exception.stack,
      'HttpException',
    );

    // Log additional context for client errors
    if (status >= 400 && status < 500) {
      this.logger.warn(
        `Client error ${status} on ${request.method} ${request.url}`,
        'HttpException',
      );
    }

    response.status(status).json(errorResponse);
  }
}

