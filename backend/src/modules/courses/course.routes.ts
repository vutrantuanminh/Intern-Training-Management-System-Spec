import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateBody, validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isSupervisorOrAdmin, isTrainerOrAbove, isCourseTrainer, hasCourseAccess } from '../../middleware/rbac.js';
import {
    createCourseSchema,
    updateCourseSchema,
    addTraineesSchema,
    addTrainersSchema,
    updateTraineeStatusSchema,
    paginationSchema,
} from '../../utils/validators.js';
import { queueEmail, emailTemplates } from '../../utils/email.js';
import { z } from 'zod';

const router = Router();

// Course list query schema
const courseListSchema = paginationSchema.extend({
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'FINISHED']).optional(),
    createdById: z.coerce.number().int().positive().optional(),
    myTrainerCourses: z.coerce.boolean().optional(),
});

// GET /api/courses - List courses
router.get(
    '/',
    authenticate,
    validateQuery(courseListSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, status, createdById, myTrainerCourses, sortBy, sortOrder } = req.query as unknown as z.infer<typeof courseListSchema>;

            const skip = (page - 1) * limit;
            const userRoles = req.user!.roles;

            // Build where clause
            const where: Record<string, unknown> = {};

            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            if (createdById) {
                where.createdById = createdById;
            }

            // Filter by trainer's courses
            if (myTrainerCourses) {
                where.trainers = {
                    some: { trainerId: req.user!.id },
                };
            }

            // If trainee, only show enrolled courses
            if (userRoles.includes('TRAINEE') && !userRoles.some(r => ['ADMIN', 'SUPERVISOR', 'TRAINER'].includes(r))) {
                where.trainees = {
                    some: { traineeId: req.user!.id },
                };
            }

            // Get courses
            const [courses, total] = await Promise.all([
                prisma.course.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                    include: {
                        creator: {
                            select: { id: true, fullName: true, email: true },
                        },
                        _count: {
                            select: {
                                subjects: true,
                                trainees: true,
                                trainers: true,
                            },
                        },
                        trainers: {
                            include: {
                                trainer: {
                                    select: { id: true, fullName: true, email: true, avatar: true },
                                },
                            },
                        },
                    },
                }),
                prisma.course.count({ where }),
            ]);

            const formattedCourses = courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                status: course.status,
                startDate: course.startDate,
                endDate: course.endDate,
                createdAt: course.createdAt,
                creator: course.creator,
                subjectCount: course._count.subjects,
                traineeCount: course._count.trainees,
                trainers: course.trainers.map(t => t.trainer),
            }));

            paginatedResponse(res, formattedCourses, { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/courses/:id - Get course by ID
router.get(
    '/:id',
    authenticate,
    hasCourseAccess,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const course = await prisma.course.findUnique({
                where: { id: parseInt(id) },
                include: {
                    creator: {
                        select: { id: true, fullName: true, email: true },
                    },
                    subjects: {
                        orderBy: { order: 'asc' },
                        include: {
                            tasks: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    trainees: {
                        include: {
                            trainee: {
                                select: { id: true, fullName: true, email: true, avatar: true },
                            },
                        },
                    },
                    trainers: {
                        include: {
                            trainer: {
                                select: { id: true, fullName: true, email: true, avatar: true },
                            },
                        },
                    },
                },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            successResponse(res, {
                ...course,
                trainees: course.trainees.map(ct => ({
                    ...ct.trainee,
                    status: ct.status,
                    enrolledAt: ct.enrolledAt,
                })),
                trainers: course.trainers.map(ct => ct.trainer),
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses - Create course
router.post(
    '/',
    authenticate,
    isSupervisorOrAdmin,
    validateBody(createCourseSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, description, startDate, endDate, subjects, trainerIds } = req.body;

            // Create course with subjects and tasks
            const course = await prisma.course.create({
                data: {
                    title,
                    description,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    createdById: req.user!.id,
                    subjects: {
                        create: subjects.map((subject: { title: string; description?: string; order?: number; tasks: { title: string; description?: string; dueDate?: string; order?: number }[] }, index: number) => ({
                            title: subject.title,
                            description: subject.description,
                            order: subject.order || index + 1,
                            tasks: {
                                create: subject.tasks.map((task, taskIndex) => ({
                                    title: task.title,
                                    description: task.description,
                                    dueDate: task.dueDate ? new Date(task.dueDate) : null,
                                    order: task.order || taskIndex + 1,
                                })),
                            },
                        })),
                    },
                    trainers: trainerIds ? {
                        create: trainerIds.map((trainerId: number) => ({
                            trainerId,
                        })),
                    } : undefined,
                },
                include: {
                    subjects: {
                        include: {
                            tasks: true,
                        },
                    },
                    trainers: {
                        include: {
                            trainer: {
                                select: { id: true, fullName: true, email: true },
                            },
                        },
                    },
                },
            });

            successResponse(res, course, 'Course created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/courses/:id - Update course
router.put(
    '/:id',
    authenticate,
    isCourseTrainer,
    validateParams(idParamSchema),
    validateBody(updateCourseSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { title, description, startDate, endDate } = req.body;

            const course = await prisma.course.update({
                where: { id: parseInt(id) },
                data: {
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                    ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                },
                include: {
                    subjects: {
                        include: { tasks: true },
                    },
                },
            });

            successResponse(res, course, 'Course updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/courses/:id - Delete course
router.delete(
    '/:id',
    authenticate,
    isSupervisorOrAdmin,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const courseId = parseInt(id);

            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            // Only allow deletion if not started
            if (course.status !== 'NOT_STARTED') {
                errorResponse(res, 'Cannot delete a course that has started', 400);
                return;
            }

            await prisma.course.delete({
                where: { id: courseId },
            });

            successResponse(res, null, 'Course deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:id/clone - Clone course
router.post(
    '/:id/clone',
    authenticate,
    isSupervisorOrAdmin,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { title, startDate, endDate } = req.body;

            const original = await prisma.course.findUnique({
                where: { id: parseInt(id) },
                include: {
                    subjects: {
                        include: { tasks: true },
                    },
                },
            });

            if (!original) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            // Create cloned course
            const cloned = await prisma.course.create({
                data: {
                    title: title || `${original.title} (Copy)`,
                    description: original.description,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    createdById: req.user!.id,
                    subjects: {
                        create: original.subjects.map(subject => ({
                            title: subject.title,
                            description: subject.description,
                            order: subject.order,
                            tasks: {
                                create: subject.tasks.map(task => ({
                                    title: task.title,
                                    description: task.description,
                                    order: task.order,
                                })),
                            },
                        })),
                    },
                },
                include: {
                    subjects: {
                        include: { tasks: true },
                    },
                },
            });

            successResponse(res, cloned, 'Course cloned successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:id/start - Start course
router.post(
    '/:id/start',
    authenticate,
    isCourseTrainer,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const courseId = parseInt(id);

            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: { subjects: true },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            if (course.status !== 'NOT_STARTED') {
                errorResponse(res, 'Course has already started', 400);
                return;
            }

            // Start course and first subject
            await prisma.$transaction([
                prisma.course.update({
                    where: { id: courseId },
                    data: {
                        status: 'IN_PROGRESS',
                        startDate: new Date(),
                    },
                }),
                // Start first subject
                ...(course.subjects.length > 0 ? [
                    prisma.subject.update({
                        where: { id: course.subjects[0].id },
                        data: {
                            status: 'IN_PROGRESS',
                            startDate: new Date(),
                        },
                    }),
                ] : []),
            ]);

            successResponse(res, null, 'Course started successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:id/finish - Finish course
router.post(
    '/:id/finish',
    authenticate,
    isCourseTrainer,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const courseId = parseInt(id);

            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            if (course.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Course is not in progress', 400);
                return;
            }

            // Finish course and all in-progress subjects
            await prisma.$transaction([
                prisma.course.update({
                    where: { id: courseId },
                    data: {
                        status: 'FINISHED',
                        endDate: new Date(),
                    },
                }),
                prisma.subject.updateMany({
                    where: { courseId, status: 'IN_PROGRESS' },
                    data: {
                        status: 'FINISHED',
                        endDate: new Date(),
                    },
                }),
                // Also finish all trainee subjects and tasks
                prisma.traineeSubject.updateMany({
                    where: {
                        subject: { courseId },
                        status: { not: 'FINISHED' },
                    },
                    data: { status: 'FINISHED' },
                }),
                prisma.traineeTask.updateMany({
                    where: {
                        task: { subject: { courseId } },
                        status: { not: 'COMPLETED' },
                    },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                    },
                }),
            ]);

            successResponse(res, null, 'Course finished successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:id/trainers - Assign trainers
router.post(
    '/:id/trainers',
    authenticate,
    isSupervisorOrAdmin,
    validateParams(idParamSchema),
    validateBody(addTrainersSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { trainerIds } = req.body;
            const courseId = parseInt(id);

            // Check if course exists
            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            // Check if trainers exist and have trainer/supervisor role
            const trainers = await prisma.user.findMany({
                where: {
                    id: { in: trainerIds },
                    roles: {
                        some: {
                            role: { name: { in: ['TRAINER', 'SUPERVISOR'] } },
                        },
                    },
                },
            });

            if (trainers.length !== trainerIds.length) {
                errorResponse(res, 'Some trainers not found or do not have trainer role', 400);
                return;
            }

            // Add trainers (ignore existing)
            await prisma.courseTrainer.createMany({
                data: trainerIds.map((trainerId: number) => ({
                    courseId,
                    trainerId,
                })),
                skipDuplicates: true,
            });

            successResponse(res, null, 'Trainers assigned successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/courses/:id/trainers/:trainerId - Remove trainer
router.delete(
    '/:id/trainers/:trainerId',
    authenticate,
    isSupervisorOrAdmin,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.id);
            const trainerId = parseInt(req.params.trainerId);

            // Check remaining trainers
            const trainerCount = await prisma.courseTrainer.count({
                where: { courseId },
            });

            if (trainerCount <= 1) {
                errorResponse(res, 'Course must have at least one trainer', 400);
                return;
            }

            await prisma.courseTrainer.delete({
                where: {
                    courseId_trainerId: {
                        courseId,
                        trainerId,
                    },
                },
            });

            successResponse(res, null, 'Trainer removed successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:id/trainees - Add trainees
router.post(
    '/:id/trainees',
    authenticate,
    isCourseTrainer,
    validateParams(idParamSchema),
    validateBody(addTraineesSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { traineeIds, activate } = req.body as { traineeIds: number[]; activate?: boolean };
            const courseId = parseInt(id);

            // Check if course exists
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: { subjects: true },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            // Check if course has started
            // if (course.status !== 'NOT_STARTED') {
            //   errorResponse(res, 'Cannot add trainees after course has started', 400);
            //   return;
            // }

            // Check if trainees exist and have trainee role
            const trainees = await prisma.user.findMany({
                where: {
                    id: { in: traineeIds },
                    roles: {
                        some: {
                            role: { name: 'TRAINEE' },
                        },
                    },
                },
            });

            if (trainees.length !== traineeIds.length) {
                errorResponse(res, 'Some trainees not found or do not have trainee role', 400);
                return;
            }

            // Add trainees
            for (const traineeId of traineeIds) {
                const existing = await prisma.courseTrainee.findUnique({
                    where: {
                        courseId_traineeId: { courseId, traineeId },
                    },
                });

                if (!existing) {
                    const courseTrainee = await prisma.courseTrainee.create({
                        data: { courseId, traineeId },
                    });

                    // Create trainee subjects; if `activate` is true, set trainee subject status to IN_PROGRESS
                    if (course.subjects.length > 0) {
                        const data = course.subjects.map(subject => ({
                            courseTraineeId: courseTrainee.id,
                            subjectId: subject.id,
                            ...(activate ? { status: 'IN_PROGRESS' as any } : {}),
                        }));

                        await prisma.traineeSubject.createMany({ data });
                    }
                }
            }

            // Send enrollment emails
            for (const trainee of trainees) {
                const emailData = emailTemplates.courseEnrollment(
                    trainee.fullName,
                    course.title,
                    `${env.frontendUrl}/courses/${courseId}`
                );
                emailData.to = trainee.email;
                await queueEmail(emailData);
            }

            successResponse(res, null, 'Trainees added successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/courses/:id/trainees/:traineeId - Remove trainee
router.delete(
    '/:id/trainees/:traineeId',
    authenticate,
    isCourseTrainer,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.id);
            const traineeId = parseInt(req.params.traineeId);

            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            // if (course.status !== 'NOT_STARTED') {
            //   errorResponse(res, 'Cannot remove trainees after course has started', 400);
            //   return;
            // }

            const trainee = await prisma.user.findUnique({
                where: { id: traineeId },
            });

            await prisma.courseTrainee.delete({
                where: {
                    courseId_traineeId: {
                        courseId,
                        traineeId,
                    },
                },
            });

            // Send removal email
            if (trainee) {
                const emailData = emailTemplates.courseRemoval(trainee.fullName, course.title);
                emailData.to = trainee.email;
                await queueEmail(emailData);
            }

            successResponse(res, null, 'Trainee removed successfully');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/courses/:courseId/trainees/:traineeId/status - Update trainee status
router.put(
    '/:courseId/trainees/:traineeId/status',
    authenticate,
    isCourseTrainer,
    validateBody(updateTraineeStatusSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.courseId);
            const traineeId = parseInt(req.params.traineeId);
            const { status } = req.body;

            await prisma.courseTrainee.update({
                where: {
                    courseId_traineeId: {
                        courseId,
                        traineeId,
                    },
                },
                data: { status },
            });

            successResponse(res, null, 'Trainee status updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
