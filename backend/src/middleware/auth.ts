import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { prisma } from '../config/database.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & { id: number };
        }
    }
}

// Authentication middleware
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            errorResponse(res, 'Access token is required', 401);
            return;
        }

        const token = authHeader.substring(7);

        // Verify token
        const payload = verifyAccessToken(token);

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user || !user.isActive) {
            errorResponse(res, 'User not found or inactive', 401);
            return;
        }

        // Attach user to request
        req.user = {
            ...payload,
            id: user.id,
            roles: user.roles.map(ur => ur.role.name),
        };

        next();
    } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            errorResponse(res, 'Token expired', 401);
            return;
        }
        errorResponse(res, 'Invalid token', 401);
    }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyAccessToken(token);

            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (user && user.isActive) {
                req.user = {
                    ...payload,
                    id: user.id,
                    roles: user.roles.map(ur => ur.role.name),
                };
            }
        }

        next();
    } catch {
        // Ignore authentication errors for optional auth
        next();
    }
};
