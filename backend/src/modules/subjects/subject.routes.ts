import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { validateBody, validateParams, idParamSchema, courseIdParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isCourseTrainer, hasCourseAccess } from '../../middleware/rbac.js';
import { createSubjectSchema, updateSubjectSchema, gradeTraineeSchema } from '../../utils/validators.js';

const router = Router();

// GET /api/courses/:courseId/subjects - List subjects for a course
router.get(
    '/courses/:courseId/subjects',
    authenticate,
    hasCourseAccess,
    validateParams(courseIdParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.courseId);

            const subjects = await prisma.subject.findMany({
                where: { courseId },
                orderBy: { order: 'asc' },
                include: {
                    tasks: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: { tasks: true },
                    },
                },
            });

            successResponse(res, subjects);
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/courses/:courseId/subjects - Create subject
router.post(
    '/courses/:courseId/subjects',
    authenticate,
    isCourseTrainer,
    validateParams(courseIdParamSchema),
    validateBody(createSubjectSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.courseId);
            const { title, description, order, tasks } = req.body;

            // Check course exists and is not finished
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    subjects: { select: { id: true } },
                    trainees: { select: { id: true } },
                },
            });

            if (!course) {
                errorResponse(res, 'Course not found', 404);
                return;
            }

            if (course.status === 'FINISHED') {
                errorResponse(res, 'Cannot add subject to finished course', 400);
                return;
            }

            // Get next order if not specified
            const maxOrder = await prisma.subject.aggregate({
                where: { courseId },
                _max: { order: true },
            });
            const nextOrder = order || (maxOrder._max.order || 0) + 1;

            // Create subject with tasks
            const subject = await prisma.subject.create({
                data: {
                    courseId,
                    title,
                    description,
                    order: nextOrder,
                    tasks: {
                        create: tasks.map((task: { title: string; description?: string; dueDate?: string; order?: number }, index: number) => ({
                            title: task.title,
                            description: task.description,
                            dueDate: task.dueDate ? new Date(task.dueDate) : null,
                            order: task.order || index + 1,
                        })),
                    },
                },
                include: {
                    tasks: true,
                },
            });

            // Create trainee subjects for existing trainees
            if (course.trainees.length > 0) {
                await prisma.traineeSubject.createMany({
                    data: course.trainees.map(ct => ({
                        courseTraineeId: ct.id,
                        subjectId: subject.id,
                    })),
                });
            }

            successResponse(res, subject, 'Subject created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/subjects/:id - Get subject by ID
router.get(
    '/subjects/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: {
                    course: {
                        select: { id: true, title: true, status: true },
                    },
                    tasks: {
                        orderBy: { order: 'asc' },
                    },
                    traineeSubjects: {
                        include: {
                            courseTrainee: {
                                include: {
                                    trainee: {
                                        select: { id: true, fullName: true, email: true, avatar: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            successResponse(res, {
                ...subject,
                traineeProgress: subject.traineeSubjects.map(ts => ({
                    trainee: ts.courseTrainee.trainee,
                    status: ts.status,
                    grade: ts.grade,
                    feedback: ts.feedback,
                    completedAt: ts.completedAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/subjects/:id/trainees - Get trainees in subject for grading
router.get(
    '/subjects/:id/trainees',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: {
                    tasks: true,
                    traineeSubjects: {
                        include: {
                            courseTrainee: {
                                include: {
                                    trainee: {
                                        select: { id: true, fullName: true, email: true, avatar: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            // Get task completion counts for each trainee
            const traineesWithProgress = await Promise.all(
                subject.traineeSubjects.map(async (ts) => {
                    const completedTasks = await prisma.traineeTask.count({
                        where: {
                            traineeId: ts.courseTrainee.traineeId,
                            taskId: { in: subject.tasks.map(t => t.id) },
                            status: 'COMPLETED',
                        },
                    });

                    return {
                        id: ts.courseTrainee.trainee.id,
                        fullName: ts.courseTrainee.trainee.fullName,
                        email: ts.courseTrainee.trainee.email,
                        avatar: ts.courseTrainee.trainee.avatar,
                        status: ts.status,
                        grade: ts.grade,
                        feedback: ts.feedback,
                        tasksCompleted: completedTasks,
                        totalTasks: subject.tasks.length,
                    };
                })
            );

            successResponse(res, traineesWithProgress);
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/subjects/:id - Update subject
router.put(
    '/subjects/:id',
    authenticate,
    validateParams(idParamSchema),
    validateBody(updateSubjectSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);
            const { title, description, startDate, endDate } = req.body;

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: { course: true },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            // Check if user is trainer of the course
            const isTrainer = await prisma.courseTrainer.findFirst({
                where: {
                    courseId: subject.courseId,
                    trainerId: req.user!.id,
                },
            });

            const userRoles = req.user!.roles;
            if (!isTrainer && !userRoles.includes('ADMIN') && !userRoles.includes('SUPERVISOR')) {
                errorResponse(res, 'Not authorized', 403);
                return;
            }

            const updated = await prisma.subject.update({
                where: { id: subjectId },
                data: {
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                    ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                },
                include: { tasks: true },
            });

            successResponse(res, updated, 'Subject updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/subjects/:id - Delete subject
router.delete(
    '/subjects/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: { course: true },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            // Only allow deletion if not started
            if (subject.status !== 'NOT_STARTED') {
                errorResponse(res, 'Cannot delete a subject that has started', 400);
                return;
            }

            // Check if user is trainer of course
            const isTrainer = await prisma.courseTrainer.findFirst({
                where: {
                    courseId: subject.courseId,
                    trainerId: req.user!.id,
                },
            });

            const userRoles = req.user!.roles;
            if (!isTrainer && !userRoles.includes('ADMIN') && !userRoles.includes('SUPERVISOR')) {
                errorResponse(res, 'Not authorized', 403);
                return;
            }

            await prisma.subject.delete({
                where: { id: subjectId },
            });

            successResponse(res, null, 'Subject deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/subjects/:id/start - Start subject
router.post(
    '/subjects/:id/start',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: { course: true },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            if (subject.status !== 'NOT_STARTED') {
                errorResponse(res, 'Subject has already started', 400);
                return;
            }

            if (subject.course.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Course must be in progress to start subject', 400);
                return;
            }

            await prisma.subject.update({
                where: { id: subjectId },
                data: {
                    status: 'IN_PROGRESS',
                    startDate: new Date(),
                },
            });

            // Update trainee subjects
            await prisma.traineeSubject.updateMany({
                where: { subjectId },
                data: { status: 'IN_PROGRESS' },
            });

            successResponse(res, null, 'Subject started successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/subjects/:id/finish - Finish subject
router.post(
    '/subjects/:id/finish',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            if (subject.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Subject is not in progress', 400);
                return;
            }

            // Finish subject
            await prisma.subject.update({
                where: { id: subjectId },
                data: {
                    status: 'FINISHED',
                    endDate: new Date(),
                },
            });

            // Finish all trainee subjects and tasks
            await prisma.traineeSubject.updateMany({
                where: { subjectId, status: { not: 'FINISHED' } },
                data: {
                    status: 'FINISHED',
                    completedAt: new Date(),
                },
            });

            await prisma.traineeTask.updateMany({
                where: {
                    task: { subjectId },
                    status: { not: 'COMPLETED' },
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            successResponse(res, null, 'Subject finished successfully');
        } catch (error) {
            next(error);
        }
    }
);

// PUT /api/subjects/:id/trainees/:traineeId/grade - Grade trainee
router.put(
    '/subjects/:id/trainees/:traineeId/grade',
    authenticate,
    validateBody(gradeTraineeSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);
            const traineeId = parseInt(req.params.traineeId);
            const { grade, feedback } = req.body;

            // Find trainee subject
            const traineeSubject = await prisma.traineeSubject.findFirst({
                where: {
                    subjectId,
                    courseTrainee: {
                        traineeId,
                    },
                },
            });

            if (!traineeSubject) {
                errorResponse(res, 'Trainee not found in this subject', 404);
                return;
            }

            await prisma.traineeSubject.update({
                where: { id: traineeSubject.id },
                data: {
                    grade,
                    ...(feedback !== undefined && { feedback }),
                },
            });

            successResponse(res, null, 'Grade updated successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/subjects/:id/tasks - Create task in subject
router.post(
    '/subjects/:id/tasks',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subjectId = parseInt(req.params.id);
            const { title, description, dueDate, order } = req.body;

            if (!title || !title.trim()) {
                errorResponse(res, 'Task title is required', 400);
                return;
            }

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: { course: true, tasks: { select: { id: true, order: true } } },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            if (subject.course.status === 'FINISHED') {
                errorResponse(res, 'Cannot add task to finished course', 400);
                return;
            }

            // Check if user is trainer of the course
            const isTrainer = await prisma.courseTrainer.findFirst({
                where: {
                    courseId: subject.courseId,
                    trainerId: req.user!.id,
                },
            });

            const userRoles = req.user!.roles;
            if (!isTrainer && !userRoles.includes('ADMIN') && !userRoles.includes('SUPERVISOR')) {
                errorResponse(res, 'Not authorized', 403);
                return;
            }

            // Get next order
            const maxOrder = subject.tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
            const nextOrder = order || maxOrder + 1;

            const task = await prisma.task.create({
                data: {
                    subjectId,
                    title: title.trim(),
                    description: description?.trim() || null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    order: nextOrder,
                },
            });

            successResponse(res, task, 'Task created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/tasks/:id - Delete task
router.delete(
    '/tasks/:id',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);

            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: { subject: { include: { course: true } } },
            });

            if (!task) {
                errorResponse(res, 'Task not found', 404);
                return;
            }

            // Check if user is trainer of course
            const isTrainer = await prisma.courseTrainer.findFirst({
                where: {
                    courseId: task.subject.courseId,
                    trainerId: req.user!.id,
                },
            });

            const userRoles = req.user!.roles;
            if (!isTrainer && !userRoles.includes('ADMIN') && !userRoles.includes('SUPERVISOR')) {
                errorResponse(res, 'Not authorized', 403);
                return;
            }

            await prisma.task.delete({
                where: { id: taskId },
            });

            successResponse(res, null, 'Task deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
