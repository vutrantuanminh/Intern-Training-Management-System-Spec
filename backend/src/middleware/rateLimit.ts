import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisStore } from '../config/redis.js';
import { env } from '../config/env.js';

// Default rate limiter
export const defaultLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: redisStore.sendCommand,
    }),
    windowMs: env.rateLimitWindowMs, // 15 minutes
    max: 1000, // DEVELOPMENT: increased from 100 to 1000
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: redisStore.sendCommand,
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // DEVELOPMENT: increased from 10 to 1000
    message: {
        success: false,
        message: 'Too many login attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});

// Upload limiter
export const uploadLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: redisStore.sendCommand,
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        success: false,
        message: 'Too many uploads, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
