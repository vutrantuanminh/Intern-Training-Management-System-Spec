import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateBody, validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainee } from '../../middleware/rbac.js';
import { createReportSchema, updateReportSchema, createTemplateSchema, paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// Report list query schema
const reportListSchema = paginationSchema.extend({
    traineeId: z.coerce.number().int().positive().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /api/daily-reports - List daily reports
router.get(
    '/',
    authenticate,
    validateQuery(reportListSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, traineeId, date, sortBy, sortOrder } = req.query as unknown as z.infer<typeof reportListSchema>;

            const skip = (page - 1) * limit;
            const userRoles = req.user!.roles;

            const where: Record<string, unknown> = {};

            // Trainees can only see their own reports
            if (userRoles.includes('TRAINEE') && !userRoles.some(r => ['ADMIN', 'SUPERVISOR', 'TRAINER'].includes(r))) {
                where.traineeId = req.user!.id;
            } else if (traineeId) {
                where.traineeId = traineeId;
            }

            if (search) {
                where.content = { contains: search, mode: 'insensitive' };
            }

            if (date) {
                where.date = new Date(date);
            }

            const [reports, total] = await Promise.all([
                prisma.dailyReport.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { date: 'desc' },
                    include: {
                        trainee: {
                            select: { id: true, fullName: true, email: true, avatar: true },
                        },
                    },
                }),
                prisma.dailyReport.count({ where }),
            ]);

            paginatedResponse(res, reports, { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/daily-reports/:id - Get report by ID
router.get(
    '/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reportId = parseInt(req.params.id);

            const report = await prisma.dailyReport.findUnique({
                where: { id: reportId },
                include: {
                    trainee: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            });

            if (!report) {
                errorResponse(res, 'Report not found', 404);
                return;
            }

            // Check access
            const userRoles = req.user!.roles;
            if (userRoles.includes('TRAINEE') && report.traineeId !== req.user!.id &&
                !userRoles.some(r => ['ADMIN', 'SUPERVISOR', 'TRAINER'].includes(r))) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            successResponse(res, report);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/daily-reports - Create report
router.post(
    '/',
    authenticate,
    isTrainee,
    validateBody(createReportSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { content, date } = req.body;
            const traineeId = req.user!.id;

            // Check if report already exists for this date
            const existingReport = await prisma.dailyReport.findUnique({
                where: {
                    traineeId_date: {
                        traineeId,
                        date: new Date(date),
                    },
                },
            });

            if (existingReport) {
                errorResponse(res, 'Report already exists for this date', 409);
                return;
            }

            const report = await prisma.dailyReport.create({
                data: {
                    traineeId,
                    content,
                    date: new Date(date),
                },
                include: {
                    trainee: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
            });

            successResponse(res, report, 'Report created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/daily-reports/:id - Update report
router.put(
    '/:id',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    validateBody(updateReportSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reportId = parseInt(req.params.id);
            const { content, date } = req.body;
            const traineeId = req.user!.id;

            const report = await prisma.dailyReport.findUnique({
                where: { id: reportId },
            });

            if (!report) {
                errorResponse(res, 'Report not found', 404);
                return;
            }

            if (report.traineeId !== traineeId) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            const updated = await prisma.dailyReport.update({
                where: { id: reportId },
                data: {
                    ...(content && { content }),
                    ...(date && { date: new Date(date) }),
                },
            });

            successResponse(res, updated, 'Report updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/daily-reports/:id - Delete report
router.delete(
    '/:id',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reportId = parseInt(req.params.id);
            const traineeId = req.user!.id;

            const report = await prisma.dailyReport.findUnique({
                where: { id: reportId },
            });

            if (!report) {
                errorResponse(res, 'Report not found', 404);
                return;
            }

            if (report.traineeId !== traineeId) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            await prisma.dailyReport.delete({
                where: { id: reportId },
            });

            successResponse(res, null, 'Report deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/daily-reports/templates/all - Get user's templates
router.get(
    '/templates/all',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const templates = await prisma.reportTemplate.findMany({
                where: { userId: req.user!.id },
                orderBy: { createdAt: 'desc' },
            });

            successResponse(res, templates);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/daily-reports/templates - Create template
router.post(
    '/templates',
    authenticate,
    validateBody(createTemplateSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, content } = req.body;

            const template = await prisma.reportTemplate.create({
                data: {
                    userId: req.user!.id,
                    title,
                    content,
                },
            });

            successResponse(res, template, 'Template created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/daily-reports/templates/:id - Update template
router.put(
    '/templates/:id',
    authenticate,
    validateParams(idParamSchema),
    validateBody(createTemplateSchema.partial()),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const templateId = parseInt(req.params.id);
            const { title, content } = req.body;

            const template = await prisma.reportTemplate.findUnique({
                where: { id: templateId },
            });

            if (!template) {
                errorResponse(res, 'Template not found', 404);
                return;
            }

            if (template.userId !== req.user!.id) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            const updated = await prisma.reportTemplate.update({
                where: { id: templateId },
                data: {
                    ...(title && { title }),
                    ...(content && { content }),
                },
            });

            successResponse(res, updated, 'Template updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/daily-reports/templates/:id - Delete template
router.delete(
    '/templates/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const templateId = parseInt(req.params.id);

            const template = await prisma.reportTemplate.findUnique({
                where: { id: templateId },
            });

            if (!template) {
                errorResponse(res, 'Template not found', 404);
                return;
            }

            if (template.userId !== req.user!.id) {
                errorResponse(res, 'Access denied', 403);
                return;
            }

            await prisma.reportTemplate.delete({
                where: { id: templateId },
            });

            successResponse(res, null, 'Template deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
