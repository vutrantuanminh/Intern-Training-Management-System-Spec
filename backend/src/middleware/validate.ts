import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Validate request body
export const validateBody = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Validate query params
export const validateQuery = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as typeof req.query;
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Validate route params
export const validateParams = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as typeof req.params;
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Common param schemas
export const idParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const courseIdParamSchema = z.object({
    courseId: z.coerce.number().int().positive(),
});
