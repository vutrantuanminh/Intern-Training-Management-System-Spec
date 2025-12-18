import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public errors?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Error handler middleware
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', err);

    // Zod validation error
    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        errorResponse(res, 'Validation error', 400, errors);
        return;
    }

    // Custom API error
    if (err instanceof ApiError) {
        errorResponse(res, err.message, err.statusCode, err.errors);
        return;
    }

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as { code?: string; meta?: { target?: string[] } };

        if (prismaError.code === 'P2002') {
            const fields = prismaError.meta?.target?.join(', ') || 'field';
            errorResponse(res, `Duplicate value for ${fields}`, 409);
            return;
        }

        if (prismaError.code === 'P2025') {
            errorResponse(res, 'Record not found', 404);
            return;
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        errorResponse(res, 'Invalid token', 401);
        return;
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse(res, 'Token expired', 401);
        return;
    }

    // Default error
    const message = env.isDev ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
};

// Not found handler
export const notFoundHandler = (
    req: Request,
    res: Response
): void => {
    errorResponse(res, `Route ${req.method} ${req.path} not found`, 404);
};
