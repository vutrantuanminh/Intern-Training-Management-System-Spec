import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateBody, validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/rbac.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import {
    createUserSchema,
    updateUserSchema,
    updateProfileSchema,
    changePasswordSchema,
    paginationSchema,
} from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// User list query schema
const userListSchema = paginationSchema.extend({
    role: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

// GET /api/users - List all users (Admin only)
router.get(
    '/',
    authenticate,
    isAdmin,
    validateQuery(userListSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, role, isActive, sortBy, sortOrder } = req.query as unknown as z.infer<typeof userListSchema>;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = {};

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { fullName: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (role) {
                where.roles = {
                    some: {
                        role: { name: role },
                    },
                };
            }

            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            // Get users
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatar: true,
                        isEmailVerified: true,
                        isActive: true,
                        createdAt: true,
                        roles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            const formattedUsers = users.map(user => ({
                ...user,
                roles: user.roles.map(ur => ur.role),
            }));

            paginatedResponse(res, formattedUsers, { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/users/profile - Get current user profile
router.get(
    '/profile',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isEmailVerified: true,
                    createdAt: true,
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

            successResponse(res, {
                ...user,
                roles: user.roles.map(ur => ur.role),
            });
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/users/profile - Update current user profile
router.put(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { fullName, avatar } = req.body;

            const user = await prisma.user.update({
                where: { id: req.user!.id },
                data: {
                    ...(fullName && { fullName }),
                    ...(avatar && { avatar }),
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isEmailVerified: true,
                    createdAt: true,
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            successResponse(res, {
                ...user,
                roles: user.roles.map(ur => ur.role),
            }, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/users/change-password - Change password
router.put(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { currentPassword, newPassword } = req.body;

            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
            });

            if (!user) {
                errorResponse(res, 'User not found', 404);
                return;
            }

            // Verify current password
            const isValid = await comparePassword(currentPassword, user.password);
            if (!isValid) {
                errorResponse(res, 'Current password is incorrect', 400);
                return;
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            await prisma.user.update({
                where: { id: req.user!.id },
                data: { password: hashedPassword },
            });

            successResponse(res, null, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/users/:id - Get user by ID (Admin only)
router.get(
    '/:id',
    authenticate,
    isAdmin,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isEmailVerified: true,
                    isActive: true,
                    createdAt: true,
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

            successResponse(res, {
                ...user,
                roles: user.roles.map(ur => ur.role),
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/users - Create user (Admin only)
router.post(
    '/',
    authenticate,
    isAdmin,
    validateBody(createUserSchema),
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

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    isEmailVerified: true, // Admin-created users are verified
                    roles: {
                        create: roles.map(role => ({
                            roleId: role.id,
                        })),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isEmailVerified: true,
                    isActive: true,
                    createdAt: true,
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            successResponse(
                res,
                {
                    ...user,
                    roles: user.roles.map(ur => ur.role),
                },
                'User created successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/users/:id - Update user (Admin only)
router.put(
    '/:id',
    authenticate,
    isAdmin,
    validateParams(idParamSchema),
    validateBody(updateUserSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { email, fullName, roleNames, isActive } = req.body;

            const userId = parseInt(id);

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!existingUser) {
                errorResponse(res, 'User not found', 404);
                return;
            }

            // Check email uniqueness if changing
            if (email && email !== existingUser.email) {
                const emailExists = await prisma.user.findUnique({
                    where: { email },
                });
                if (emailExists) {
                    errorResponse(res, 'Email already in use', 409);
                    return;
                }
            }

            // Update roles if provided
            if (roleNames) {
                const roles = await prisma.role.findMany({
                    where: { name: { in: roleNames } },
                });

                if (roles.length !== roleNames.length) {
                    errorResponse(res, 'Invalid role names', 400);
                    return;
                }

                // Delete existing roles and add new ones
                await prisma.userRole.deleteMany({
                    where: { userId },
                });

                await prisma.userRole.createMany({
                    data: roles.map(role => ({
                        userId,
                        roleId: role.id,
                    })),
                });
            }

            // Update user
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(email && { email }),
                    ...(fullName && { fullName }),
                    ...(isActive !== undefined && { isActive }),
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isEmailVerified: true,
                    isActive: true,
                    createdAt: true,
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            successResponse(res, {
                ...user,
                roles: user.roles.map(ur => ur.role),
            }, 'User updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete(
    '/:id',
    authenticate,
    isAdmin,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = parseInt(id);

            // Prevent self-deletion
            if (userId === req.user!.id) {
                errorResponse(res, 'Cannot delete your own account', 400);
                return;
            }

            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                errorResponse(res, 'User not found', 404);
                return;
            }

            // Soft delete (deactivate)
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });

            successResponse(res, null, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
