/**
 * Core Module Usage Examples
 * 
 * Ejemplos completos de cómo usar todos los servicios del Core Module
 */

import { Injectable, Controller, Get, Post, Body } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { DatabaseService } from '../database/database.service';
import { MetricsService } from '../monitoring/metrics.service';
import { Transactional } from '../database/transaction.decorator';
import { PrismaService } from 'src/prisma.service';

// ==================== LOGGER EXAMPLES ====================

@Injectable()
export class UserServiceExample {
  constructor(private readonly logger: LoggerService) {
    // Establecer contexto del servicio
    this.logger.setContext('UserService');
  }

  async createUser(email: string, password: string) {
    // Log info
    this.logger.log(`Creating user: ${email}`);

    try {
      // ... lógica de creación
      const user = { id: '123', email };

      // Log exitoso
      this.logger.log(`User created successfully: ${user.id}`);
      
      return user;
    } catch (error) {
      // Log error con stack trace
      this.logger.error(
        `Failed to create user: ${email}`,
        error.stack,
        'UserService'
      );
      throw error;
    }
  }

  async processPayment(amount: number) {
    const startTime = Date.now();
    
    // ... proceso de pago
    
    const duration = Date.now() - startTime;
    
    // Log performance
    this.logger.logPerformance('payment_processing', duration, {
      amount,
      currency: 'USD'
    });
  }

  async detectSuspiciousActivity(userId: string, ip: string) {
    // Log security event
    this.logger.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      userId,
      ip,
      reason: 'Multiple failed attempts',
    });
  }
}

// ==================== DATABASE EXAMPLES ====================

@Injectable()
export class OrderServiceExample {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('OrderService');
  }

  // Ejemplo 1: Transacción con DatabaseService
  async createOrderWithItems(orderData: any, items: any[]) {
    return this.db.transaction(async (tx) => {
      // Crear orden
      const order = await tx.order.create({
        data: orderData,
      });

      // Crear items
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...item,
          },
        });
      }

      // Actualizar stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      this.logger.log(`Order created: ${order.id} with ${items.length} items`);
      
      return order;
    });
  }

  // Ejemplo 2: Transacción con opciones
  async complexOperation() {
    return this.db.transaction(
      async (tx) => {
        // Operaciones
      },
      {
        maxWait: 5000, // 5 segundos
        timeout: 10000, // 10 segundos
      }
    );
  }

  // Ejemplo 3: Raw SQL query
  async getTopProducts(limit: number) {
    return this.db.queryRaw<any[]>(
      `
      SELECT p.*, COUNT(oi.id) as sales_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY sales_count DESC
      LIMIT ?
      `,
      [limit]
    );
  }

  // Ejemplo 4: Raw SQL execution
  async cleanupOldRecords() {
    const deletedCount = await this.db.executeRaw(
      `DELETE FROM sessions WHERE expires_at < NOW()`
    );
    
    this.logger.log(`Cleaned up ${deletedCount} old sessions`);
    return deletedCount;
  }

  // Ejemplo 5: Health check
  async checkDatabaseConnection() {
    const isHealthy = await this.db.healthCheck();
    if (!isHealthy) {
      this.logger.error('Database health check failed', undefined, 'OrderService');
    }
    return isHealthy;
  }
}

// ==================== TRANSACTIONAL DECORATOR EXAMPLES ====================

@Injectable()
export class AccountServiceExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AccountService');
  }

  // Ejemplo 1: Método con @Transactional
  @Transactional()
  async transferMoney(fromId: string, toId: string, amount: number) {
    // Todo aquí se ejecuta en una transacción atómica
    
    // Verificar saldo suficiente
    const fromAccount = await this.prisma.account.findUnique({
      where: { id: fromId },
    });

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }

    // Restar del remitente
    await this.prisma.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    // Sumar al destinatario
    await this.prisma.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    // Crear registro de transacción
    await this.prisma.transaction.create({
      data: {
        fromId,
        toId,
        amount,
        type: 'TRANSFER',
      },
    });

    this.logger.log(`Transferred ${amount} from ${fromId} to ${toId}`);
  }

  // Ejemplo 2: Actualizar usuario y perfil atómicamente
  @Transactional()
  async updateUserAndProfile(userId: string, userData: any, profileData: any) {
    await this.prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    await this.prisma.profile.update({
      where: { userId },
      data: profileData,
    });
  }
}

// ==================== METRICS EXAMPLES ====================

@Injectable()
export class GameServiceExample {
  constructor(
    private readonly metrics: MetricsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('GameService');
  }

  // Ejemplo 1: Tracking de juegos activos
  async startGame(userId: string) {
    // Incrementar contador de juegos activos
    this.metrics.activeGames.inc();
    
    this.logger.log(`Game started for user ${userId}`);
    
    // ... lógica del juego
  }

  async endGame(userId: string, score: number) {
    // Decrementar contador de juegos activos
    this.metrics.activeGames.dec();
    
    this.logger.log(`Game ended for user ${userId} with score ${score}`);
  }

  // Ejemplo 2: Métricas de performance
  async processGameLogic() {
    const startTime = Date.now();
    
    // ... lógica pesada
    
    const duration = Date.now() - startTime;
    
    // Registrar métrica de duración
    this.metrics.dbQueryDuration.observe(
      { operation: 'game_logic', model: 'Game' },
      duration / 1000
    );
  }

  // Ejemplo 3: Tracking de usuarios activos
  async userLogin(userId: string) {
    this.metrics.incrementActiveUsers();
    this.logger.log(`User logged in: ${userId}`);
  }

  async userLogout(userId: string) {
    this.metrics.decrementActiveUsers();
    this.logger.log(`User logged out: ${userId}`);
  }

  // Ejemplo 4: Métricas custom
  async recordMatchmaking(duration: number, playersFound: number) {
    this.metrics.dbQueriesTotal.inc({
      operation: 'matchmaking',
      model: 'Game',
    });

    this.logger.logPerformance('matchmaking', duration, {
      playersFound,
    });
  }
}

// ==================== AUTH METRICS EXAMPLES ====================

@Injectable()
export class AuthServiceExample {
  constructor(
    private readonly metrics: MetricsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  async login(email: string, password: string, provider: string = 'email') {
    try {
      // Validar credenciales
      const isValid = await this.validateCredentials(email, password);

      // Registrar intento
      this.metrics.recordAuthAttempt('local', provider, isValid);

      if (!isValid) {
        this.logger.logSecurityEvent('FAILED_LOGIN', {
          email,
          provider,
        });
        throw new Error('Invalid credentials');
      }

      this.logger.log(`Successful login: ${email}`);
      return { success: true };
    } catch (error) {
      // Registrar fallo con razón
      this.metrics.recordAuthAttempt(
        'local',
        provider,
        false,
        'invalid_credentials'
      );
      throw error;
    }
  }

  private async validateCredentials(email: string, password: string) {
    // Mock validation
    return email && password;
  }

  async loginWithOAuth(provider: 'google' | 'github', code: string) {
    try {
      // ... lógica OAuth
      const success = true;

      this.metrics.recordAuthAttempt('oauth', provider, success);
      
      return { success };
    } catch (error) {
      this.metrics.recordAuthAttempt('oauth', provider, false, error.message);
      throw error;
    }
  }
}

// ==================== CONTROLLER EXAMPLES ====================

@Controller('examples')
export class ExamplesController {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly db: DatabaseService,
  ) {
    this.logger.setContext('ExamplesController');
  }

  @Get('health-custom')
  async customHealthCheck() {
    const dbHealthy = await this.db.healthCheck();
    
    if (!dbHealthy) {
      this.logger.error('Custom health check failed', undefined, 'Health');
    }

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('process')
  async processData(@Body() data: any) {
    const startTime = Date.now();
    
    try {
      // Procesar datos en transacción
      const result = await this.db.transaction(async (tx) => {
        // ... operaciones
        return { processed: true };
      });

      const duration = Date.now() - startTime;
      
      // Log performance
      this.logger.logPerformance('data_processing', duration, {
        dataSize: JSON.stringify(data).length,
      });

      // Registrar métrica
      this.metrics.recordHttpRequest('POST', '/examples/process', 200, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Data processing failed', error.stack);
      this.metrics.recordHttpError('POST', '/examples/process', error.name);
      
      throw error;
    }
  }

  @Get('metrics-summary')
  async getMetricsSummary() {
    // Este endpoint podría devolver un resumen legible
    return {
      message: 'Check /metrics for Prometheus format',
      metricsEndpoint: '/metrics',
    };
  }
}

// ==================== COMBINED EXAMPLE ====================

@Injectable()
export class CompleteExample {
  constructor(
    private readonly logger: LoggerService,
    private readonly db: DatabaseService,
    private readonly metrics: MetricsService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext('CompleteExample');
  }

  @Transactional()
  async complexBusinessOperation(userId: string, data: any) {
    const startTime = Date.now();

    try {
      // Log inicio
      this.logger.log(`Starting complex operation for user ${userId}`);

      // 1. Crear registro principal
      const record = await this.prisma.mainRecord.create({
        data: {
          userId,
          ...data,
        },
      });

      // 2. Crear registros relacionados
      await this.prisma.relatedRecord.createMany({
        data: data.items.map((item: any) => ({
          mainRecordId: record.id,
          ...item,
        })),
      });

      // 3. Actualizar contadores
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          operationCount: { increment: 1 },
        },
      });

      const duration = Date.now() - startTime;

      // Log performance
      this.logger.logPerformance('complex_operation', duration, {
        userId,
        itemsCount: data.items.length,
      });

      // Registrar métricas
      this.metrics.recordDbQuery('complex_operation', 'MainRecord', duration);

      // Log éxito
      this.logger.log(`Complex operation completed for user ${userId}`);

      return record;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error completo
      this.logger.error(
        `Complex operation failed for user ${userId}`,
        error.stack,
        'CompleteExample'
      );

      // Log security si es relevante
      if (error.message.includes('permission')) {
        this.logger.logSecurityEvent('UNAUTHORIZED_OPERATION', {
          userId,
          operation: 'complex_operation',
        });
      }

      throw error;
    }
  }
}

