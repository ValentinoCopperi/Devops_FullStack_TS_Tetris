import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    public readonly client: Redis;
    private readonly logger = new Logger(RedisService.name);

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST ?? 'redis',
            port: parseInt(process.env.REDIS_PORT ?? '6379'),
            password: process.env.REDIS_PASSWORD ?? undefined,
        });
    }

    async onModuleInit() {
        try {
            // ioredis se conecta automáticamente, solo verificamos con ping()
            const pong = await this.client.ping();
            this.logger.log(`Conectado a Redis: ${pong}`);
        } catch (error) {
            this.logger.error(`Error al conectar a Redis: ${error}`);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.client.disconnect();
        this.logger.log('Desconectado de Redis correctamente');
    }

    /**
     * Get a value from Redis
     */
    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    /**
     * Set a value in Redis with optional expiration
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    /**
     * Delete a key from Redis
     */
    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }
}