import Redis from 'ioredis';
import { env } from './env.js';

// Create Redis client
export const redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});

// Wrapper for rate-limit-redis compatibility
export const redisStore = {
    sendCommand: async (...args: string[]): Promise<number> => {
        const result = await redis.call(args[0], ...args.slice(1));
        return result as number;
    },
};

redis.on('connect', () => {
    console.log('✅ Redis connected');
});

redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

// Helper functions for caching
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.setex(key, ttlSeconds, data);
        } else {
            await redis.set(key, data);
        }
    },

    async del(key: string): Promise<void> {
        await redis.del(key);
    },

    async delPattern(pattern: string): Promise<void> {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};

// Session store helper
export const sessionStore = {
    async setSession(userId: number, token: string, ttlSeconds: number): Promise<void> {
        await redis.setex(`session:${userId}:${token}`, ttlSeconds, 'active');
    },

    async getSession(userId: number, token: string): Promise<boolean> {
        const result = await redis.get(`session:${userId}:${token}`);
        return result === 'active';
    },

    async deleteSession(userId: number, token: string): Promise<void> {
        await redis.del(`session:${userId}:${token}`);
    },

    async deleteAllSessions(userId: number): Promise<void> {
        const keys = await redis.keys(`session:${userId}:*`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};
