import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // HTTP Metrics
  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly httpRequestErrors: Counter;

  // Database Metrics
  public readonly dbQueriesTotal: Counter;
  public readonly dbQueryDuration: Histogram;
  public readonly dbConnectionsActive: Gauge;

  // Auth Metrics
  public readonly authAttemptsTotal: Counter;
  public readonly authSuccessTotal: Counter;
  public readonly authFailuresTotal: Counter;

  // Business Metrics
  public readonly activeUsers: Gauge;
  public readonly activeGames: Gauge;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueriesTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'model'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Auth Metrics
    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['method', 'provider'],
      registers: [this.registry],
    });

    this.authSuccessTotal = new Counter({
      name: 'auth_success_total',
      help: 'Total number of successful authentications',
      labelNames: ['method', 'provider'],
      registers: [this.registry],
    });

    this.authFailuresTotal = new Counter({
      name: 'auth_failures_total',
      help: 'Total number of failed authentications',
      labelNames: ['method', 'provider', 'reason'],
      registers: [this.registry],
    });

    // Business Metrics
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      registers: [this.registry],
    });

    this.activeGames = new Gauge({
      name: 'active_games',
      help: 'Number of currently active games',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Initialize any startup metrics
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  // Helper methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration / 1000);
  }

  recordHttpError(method: string, route: string, errorType: string) {
    this.httpRequestErrors.inc({ method, route, error_type: errorType });
  }

  recordDbQuery(operation: string, model: string, duration: number) {
    this.dbQueriesTotal.inc({ operation, model });
    this.dbQueryDuration.observe({ operation, model }, duration / 1000);
  }

  recordAuthAttempt(method: string, provider: string, success: boolean, reason?: string) {
    this.authAttemptsTotal.inc({ method, provider });
    
    if (success) {
      this.authSuccessTotal.inc({ method, provider });
    } else {
      this.authFailuresTotal.inc({ method, provider, reason: reason || 'unknown' });
    }
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  setActiveGames(count: number) {
    this.activeGames.set(count);
  }

  incrementActiveUsers() {
    this.activeUsers.inc();
  }

  decrementActiveUsers() {
    this.activeUsers.dec();
  }
}

