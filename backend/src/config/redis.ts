import Redis from 'ioredis';
import { env } from './env.js';

// Create Redis client only if REDIS_URL is provided
const redisUrl = env.redisUrl || 'redis://localhost:6379';
const isRedisEnabled = !!env.redisUrl;

export const redis = isRedisEnabled
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    })
    : null;

// Wrapper for rate-limit-redis compatibility
export const redisStore = redis
    ? {
        sendCommand: async (...args: string[]): Promise<number> => {
            const result = await redis!.call(args[0], ...args.slice(1));
            return result as number;
        },
    }
    : null;

if (redis) {
    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
        console.error('❌ Redis error:', err);
    });
} else {
    console.log('⚠️  Redis disabled - running without cache');
}

// Helper functions for caching
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redis) return null;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        if (!redis) return;
        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.setex(key, ttlSeconds, data);
        } else {
            await redis.set(key, data);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis) return;
        await redis.del(key);
    },

    async delPattern(pattern: string): Promise<void> {
        if (!redis) return;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};

// Session store helper
export const sessionStore = {
    async setSession(userId: number, token: string, ttlSeconds: number): Promise<void> {
        if (!redis) return;
        await redis.setex(`session:${userId}:${token}`, ttlSeconds, 'active');
    },

    async getSession(userId: number, token: string): Promise<boolean> {
        if (!redis) return true; // Allow if Redis not available
        const result = await redis.get(`session:${userId}:${token}`);
        return result === 'active';
    },

    async deleteSession(userId: number, token: string): Promise<void> {
        if (!redis) return;
        await redis.del(`session:${userId}:${token}`);
    },

    async deleteAllSessions(userId: number): Promise<void> {
        if (!redis) return;
        const keys = await redis.keys(`session:${userId}:*`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};
