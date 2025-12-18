import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateBody, validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainee, isTrainerOrAbove } from '../../middleware/rbac.js';
import { createPRSchema, updatePRSchema, rejectPRSchema, addPRCommentSchema, paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// PR list query schema
const prListSchema = paginationSchema.extend({
    traineeId: z.coerce.number().int().positive().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

// GET /api/pull-requests - List pull requests
router.get(
    '/',
    authenticate,
    validateQuery(prListSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, traineeId, status, sortBy, sortOrder } = req.query as unknown as z.infer<typeof prListSchema>;

            const skip = (page - 1) * limit;
            const userRoles = req.user!.roles;

            const where: Record<string, unknown> = {};

            // Trainees can only see their own PRs
            if (userRoles.includes('TRAINEE') && !userRoles.some(r => ['ADMIN', 'SUPERVISOR', 'TRAINER'].includes(r))) {
                where.traineeId = req.user!.id;
            } else if (traineeId) {
                where.traineeId = traineeId;
            }

            if (status) {
                where.status = status;
            }

            const [pullRequests, total] = await Promise.all([
                prisma.pullRequest.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                    include: {
                        trainee: {
                            select: { id: true, fullName: true, email: true, avatar: true },
                        },
                        task: {
                            select: { id: true, title: true, subject: { select: { id: true, title: true, course: { select: { id: true, title: true } } } } },
                        },
                        reviewer: {
                            select: { id: true, fullName: true, email: true, avatar: true },
                        },
                        _count: {
                            select: { comments: true },
                        },
                    },
                }),
                prisma.pullRequest.count({ where }),
            ]);

            paginatedResponse(res, pullRequests, { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/pull-requests/:id - Get PR by ID
router.get(
    '/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
                include: {
                    trainee: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                            subject: {
                                select: {
                                    id: true,
                                    title: true,
                                    course: { select: { id: true, title: true } },
                                },
                            },
                        },
                    },
                    reviewer: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    comments: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            user: {
                                select: { id: true, fullName: true, email: true, avatar: true },
                            },
                        },
                    },
                },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            successResponse(res, pr);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/pull-requests - Create PR
router.post(
    '/',
    authenticate,
    isTrainee,
    validateBody(createPRSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, description, repoUrl, taskId } = req.body;
            const traineeId = req.user!.id;

            const pr = await prisma.pullRequest.create({
                data: {
                    traineeId,
                    title,
                    description,
                    repoUrl,
                    taskId,
                },
                include: {
                    trainee: {
                        select: { id: true, fullName: true, email: true },
                    },
                    task: {
                        select: { id: true, title: true },
                    },
                },
            });

            // Create notification for trainers
            if (taskId) {
                const task = await prisma.task.findUnique({
                    where: { id: taskId },
                    include: {
                        subject: {
                            include: {
                                course: {
                                    include: {
                                        trainers: { select: { trainerId: true } },
                                    },
                                },
                            },
                        },
                    },
                });

                if (task) {
                    await prisma.notification.createMany({
                        data: task.subject.course.trainers.map(t => ({
                            userId: t.trainerId,
                            type: 'PR',
                            title: 'New Pull Request',
                            message: `${req.user!.email} submitted a PR: ${title}`,
                            linkTo: `/pull-requests/${pr.id}`,
                        })),
                    });
                }
            }

            successResponse(res, pr, 'Pull request created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/pull-requests/:id - Update PR
router.put(
    '/:id',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    validateBody(updatePRSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);
            const { title, description } = req.body;
            const traineeId = req.user!.id;

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            if (pr.traineeId !== traineeId) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            if (pr.status !== 'PENDING') {
                errorResponse(res, 'Cannot update reviewed PR', 400);
                return;
            }

            const updated = await prisma.pullRequest.update({
                where: { id: prId },
                data: {
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                },
            });

            successResponse(res, updated, 'Pull request updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/pull-requests/:id/approve - Approve PR
router.put(
    '/:id/approve',
    authenticate,
    isTrainerOrAbove,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            if (pr.status !== 'PENDING') {
                errorResponse(res, 'PR already reviewed', 400);
                return;
            }

            await prisma.pullRequest.update({
                where: { id: prId },
                data: {
                    status: 'APPROVED',
                    reviewerId: req.user!.id,
                    reviewedAt: new Date(),
                },
            });

            // Notify trainee
            await prisma.notification.create({
                data: {
                    userId: pr.traineeId,
                    type: 'PR',
                    title: 'Pull Request Approved',
                    message: `Your PR "${pr.title}" has been approved!`,
                    linkTo: `/pull-requests/${prId}`,
                },
            });

            successResponse(res, null, 'Pull request approved successfully');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/pull-requests/:id/reject - Reject PR
router.put(
    '/:id/reject',
    authenticate,
    isTrainerOrAbove,
    validateParams(idParamSchema),
    validateBody(rejectPRSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);
            const { reason } = req.body;

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            if (pr.status !== 'PENDING') {
                errorResponse(res, 'PR already reviewed', 400);
                return;
            }

            await prisma.pullRequest.update({
                where: { id: prId },
                data: {
                    status: 'REJECTED',
                    reviewerId: req.user!.id,
                    reviewedAt: new Date(),
                },
            });

            // Add rejection comment if reason provided
            if (reason) {
                await prisma.pRComment.create({
                    data: {
                        prId,
                        userId: req.user!.id,
                        content: `Rejection reason: ${reason}`,
                    },
                });
            }

            // Notify trainee
            await prisma.notification.create({
                data: {
                    userId: pr.traineeId,
                    type: 'PR',
                    title: 'Pull Request Rejected',
                    message: `Your PR "${pr.title}" has been rejected.`,
                    linkTo: `/pull-requests/${prId}`,
                },
            });

            successResponse(res, null, 'Pull request rejected');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/pull-requests/:id/comments - Add comment
router.post(
    '/:id/comments',
    authenticate,
    validateParams(idParamSchema),
    validateBody(addPRCommentSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);
            const { content } = req.body;

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            const comment = await prisma.pRComment.create({
                data: {
                    prId,
                    userId: req.user!.id,
                    content,
                },
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            });

            // Notify PR author if commenter is different
            if (pr.traineeId !== req.user!.id) {
                await prisma.notification.create({
                    data: {
                        userId: pr.traineeId,
                        type: 'PR',
                        title: 'New Comment on PR',
                        message: `New comment on your PR "${pr.title}"`,
                        linkTo: `/pull-requests/${prId}`,
                    },
                });
            }

            successResponse(res, comment, 'Comment added successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/pull-requests/:id - Delete PR
router.delete(
    '/:id',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const prId = parseInt(req.params.id);
            const traineeId = req.user!.id;

            const pr = await prisma.pullRequest.findUnique({
                where: { id: prId },
            });

            if (!pr) {
                errorResponse(res, 'Pull request not found', 404);
                return;
            }

            if (pr.traineeId !== traineeId) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            if (pr.status !== 'PENDING') {
                errorResponse(res, 'Cannot delete reviewed PR', 400);
                return;
            }

            await prisma.pullRequest.delete({
                where: { id: prId },
            });

            successResponse(res, null, 'Pull request deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
