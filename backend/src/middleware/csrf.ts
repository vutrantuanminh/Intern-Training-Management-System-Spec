import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { errorResponse } from '../utils/response.js';

// CSRF token cookie name
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Generate CSRF token
export const generateCsrfToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Set CSRF token in cookie
export const setCsrfToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Only set token if not already set
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false, // Must be accessible by JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        // Attach to request for access in route
        (req as any).csrfToken = token;
    } else {
        (req as any).csrfToken = req.cookies[CSRF_COOKIE_NAME];
    }
    next();
};

// Verify CSRF token
export const verifyCsrfToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Skip for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        next();
        return;
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
        errorResponse(res, 'CSRF token missing', 403);
        return;
    }

    if (cookieToken !== headerToken) {
        errorResponse(res, 'CSRF token mismatch', 403);
        return;
    }

    next();
};
