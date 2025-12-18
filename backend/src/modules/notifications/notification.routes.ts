import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import { validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// GET /api/notifications - Get user's notifications
router.get(
    '/',
    authenticate,
    validateQuery(paginationSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const { page, limit } = req.query as unknown as z.infer<typeof paginationSchema>;
            const skip = (page - 1) * limit;

            const [notifications, total] = await Promise.all([
                prisma.notification.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.notification.count({ where: { userId } }),
            ]);

            const unreadCount = await prisma.notification.count({
                where: { userId, isRead: false },
            });

            paginatedResponse(res, notifications, { page, limit, total });
            // Add unread count to response
            res.locals.unreadCount = unreadCount;
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/notifications/:id/read - Mark as read
router.put(
    '/:id/read',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const notificationId = parseInt(req.params.id);
            const userId = req.user!.id;

            await prisma.notification.updateMany({
                where: { id: notificationId, userId },
                data: { isRead: true },
            });

            successResponse(res, null, 'Notification marked as read');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/notifications/read-all - Mark all as read
router.put(
    '/read-all',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;

            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });

            successResponse(res, null, 'All notifications marked as read');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/notifications/:id - Delete notification
router.delete(
    '/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const notificationId = parseInt(req.params.id);
            const userId = req.user!.id;

            await prisma.notification.deleteMany({
                where: { id: notificationId, userId },
            });

            successResponse(res, null, 'Notification deleted');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
