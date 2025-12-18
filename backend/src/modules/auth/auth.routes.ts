import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateVerifyToken,
    generateResetToken,
} from '../../utils/jwt.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { validateBody } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../../utils/validators.js';
import { queueEmail, emailTemplates } from '../../utils/email.js';
import { isAdmin } from '../../middleware/rbac.js';

const router = Router();

// GET /api/auth/me - Get current user from token
router.get(
    '/me',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (!user) {
                errorResponse(res, 'User not found', 404);
                return;
            }

            const roles = user.roles.map((ur) => ur.role.name);

            successResponse(res, {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                roles,
                isEmailVerified: user.isEmailVerified,
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/auth/csrf
router.get('/csrf', (req, res) => {
    successResponse(res, { csrfToken: (req as any).csrfToken }, 'CSRF token set');
});

router.post(
    '/login',
    authLimiter,
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (!user) {
                errorResponse(res, 'Invalid email or password', 401);
                return;
            }

            // Check password
            const isValidPassword = await comparePassword(password, user.password);
            if (!isValidPassword) {
                errorResponse(res, 'Invalid email or password', 401);
                return;
            }

            // Check if user is active
            if (!user.isActive) {
                errorResponse(res, 'Account is deactivated', 403);
                return;
            }

            // Check email verification
            if (!user.isEmailVerified) {
                errorResponse(res, 'Please verify your email first', 403);
                return;
            }

            // Get roles
            const roles = user.roles.map(ur => ur.role.name);

            // Generate tokens
            const tokenId = uuidv4();
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                roles,
            });
            const refreshToken = generateRefreshToken({
                userId: user.id,
                tokenId,
            });

            // Save refresh token
            await prisma.refreshToken.create({
                data: {
                    token: tokenId,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });

            // Set refresh token as httpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.isProd,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            successResponse(res, {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    roles,
                    isEmailVerified: user.isEmailVerified,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/register (Admin only)
router.post(
    '/register',
    authenticate,
    isAdmin,
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password, fullName, roleNames } = req.body;

            // Check if email exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                errorResponse(res, 'Email already registered', 409);
                return;
            }

            // Get role IDs
            const roles = await prisma.role.findMany({
                where: { name: { in: roleNames } },
            });

            if (roles.length !== roleNames.length) {
                errorResponse(res, 'Invalid role names', 400);
                return;
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Generate verify token
            const verifyToken = generateVerifyToken();

            // Create user with roles
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    verifyToken,
                    roles: {
                        create: roles.map(role => ({
                            roleId: role.id,
                        })),
                    },
                },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            // Send verification email
            const verifyUrl = `${env.frontendUrl}/verify-email?token=${verifyToken}`;
            const emailData = emailTemplates.verifyEmail(fullName, verifyUrl);
            emailData.to = email;
            await queueEmail(emailData);

            successResponse(
                res,
                {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    roles: user.roles.map(ur => ur.role.name),
                },
                'User created successfully. Verification email sent.',
                201
            );
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/auth/verify-email/:token
router.get(
    '/verify-email/:token',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { token } = req.params;

            const user = await prisma.user.findFirst({
                where: { verifyToken: token },
            });

            if (!user) {
                errorResponse(res, 'Invalid or expired verification token', 400);
                return;
            }

            // Update user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: true,
                    verifyToken: null,
                },
            });

            successResponse(res, null, 'Email verified successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/resend-verification
router.post(
    '/resend-verification',
    authLimiter,
    validateBody(forgotPasswordSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;

            const user = await prisma.user.findUnique({
                where: { email },
            });

            // Don't reveal if user exists
            if (!user || user.isEmailVerified) {
                successResponse(res, null, 'If your email is registered and unverified, you will receive a verification email');
                return;
            }

            // Generate new token
            const verifyToken = generateVerifyToken();
            await prisma.user.update({
                where: { id: user.id },
                data: { verifyToken },
            });

            // Send email
            const verifyUrl = `${env.frontendUrl}/verify-email?token=${verifyToken}`;
            const emailData = emailTemplates.verifyEmail(user.fullName, verifyUrl);
            emailData.to = email;
            await queueEmail(emailData);

            successResponse(res, null, 'If your email is registered and unverified, you will receive a verification email');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/forgot-password
router.post(
    '/forgot-password',
    authLimiter,
    validateBody(forgotPasswordSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;

            const user = await prisma.user.findUnique({
                where: { email },
            });

            // Don't reveal if user exists
            if (!user) {
                successResponse(res, null, 'If your email is registered, you will receive a password reset email');
                return;
            }

            // Generate reset token
            const resetToken = generateResetToken();
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                },
            });

            // Send email
            const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;
            const emailData = emailTemplates.resetPassword(user.fullName, resetUrl);
            emailData.to = email;
            await queueEmail(emailData);

            successResponse(res, null, 'If your email is registered, you will receive a password reset email');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/reset-password
router.post(
    '/reset-password',
    validateBody(resetPasswordSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { token, newPassword } = req.body;

            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetExpires: { gt: new Date() },
                },
            });

            if (!user) {
                errorResponse(res, 'Invalid or expired reset token', 400);
                return;
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetExpires: null,
                },
            });

            // Invalidate all refresh tokens
            await prisma.refreshToken.deleteMany({
                where: { userId: user.id },
            });

            successResponse(res, null, 'Password reset successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/refresh-token
router.post(
    '/refresh-token',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Get refresh token from cookie or body
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                errorResponse(res, 'Refresh token required', 401);
                return;
            }

            // Verify token
            const payload = verifyRefreshToken(refreshToken);

            // Check if token exists in database
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: payload.tokenId },
                include: {
                    user: {
                        include: {
                            roles: {
                                include: {
                                    role: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                errorResponse(res, 'Invalid or expired refresh token', 401);
                return;
            }

            // Delete old token
            await prisma.refreshToken.delete({
                where: { token: payload.tokenId },
            });

            // Generate new tokens
            const user = storedToken.user;
            const roles = user.roles.map(ur => ur.role.name);
            const newTokenId = uuidv4();

            const newAccessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                roles,
            });
            const newRefreshToken = generateRefreshToken({
                userId: user.id,
                tokenId: newTokenId,
            });

            // Save new refresh token
            await prisma.refreshToken.create({
                data: {
                    token: newTokenId,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            // Set new refresh token cookie
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: env.isProd,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            successResponse(res, {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/auth/logout
router.post(
    '/logout',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Get refresh token
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (refreshToken) {
                try {
                    const payload = verifyRefreshToken(refreshToken);
                    await prisma.refreshToken.delete({
                        where: { token: payload.tokenId },
                    });
                } catch {
                    // Ignore token verification errors
                }
            }

            // Clear cookie
            res.clearCookie('refreshToken');

            successResponse(res, null, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
