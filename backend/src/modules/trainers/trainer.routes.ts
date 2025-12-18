import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import { validateQuery } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainerOrAbove } from '../../middleware/rbac.js';
import { paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// GET /api/trainer/dashboard - Get trainer dashboard
router.get(
    '/dashboard',
    authenticate,
    isTrainerOrAbove,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const trainerId = req.user!.id;

            // Get courses where user is trainer
            const trainerCourses = await prisma.courseTrainer.findMany({
                where: { trainerId },
                include: {
                    course: {
                        include: {
                            _count: {
                                select: { subjects: true, trainees: true },
                            },
                            trainees: {
                                include: {
                                    trainee: {
                                        select: { id: true, fullName: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            // Get pending PRs for trainer's courses
            const courseIds = trainerCourses.map(tc => tc.course.id);
            const pendingPRs = await prisma.pullRequest.findMany({
                where: {
                    status: 'PENDING',
                    task: {
                        subject: {
                            courseId: { in: courseIds },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    trainee: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                            subject: {
                                select: { id: true, title: true, courseId: true },
                            },
                        },
                    },
                },
            });

            // Get recent activity
            const recentReports = await prisma.dailyReport.findMany({
                where: {
                    trainee: {
                        courseTrainees: {
                            some: {
                                courseId: { in: courseIds },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    trainee: {
                        select: { id: true, fullName: true, avatar: true },
                    },
                },
            });

            // Statistics
            const totalTrainees = await prisma.courseTrainee.count({
                where: { courseId: { in: courseIds } },
            });

            const activeTrainees = await prisma.courseTrainee.count({
                where: {
                    courseId: { in: courseIds },
                    status: 'ACTIVE',
                },
            });

            successResponse(res, {
                courses: trainerCourses.map(tc => ({
                    ...tc.course,
                    subjectCount: tc.course._count.subjects,
                    traineeCount: tc.course._count.trainees,
                })),
                pendingPRs,
                recentReports,
                statistics: {
                    totalCourses: trainerCourses.length,
                    activeCourses: trainerCourses.filter(tc => tc.course.status === 'IN_PROGRESS').length,
                    totalTrainees,
                    activeTrainees,
                    pendingPRCount: pendingPRs.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/trainer/courses - Get trainer's courses
router.get(
    '/courses',
    authenticate,
    isTrainerOrAbove,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const trainerId = req.user!.id;

            const courses = await prisma.courseTrainer.findMany({
                where: { trainerId },
                include: {
                    course: {
                        include: {
                            subjects: {
                                orderBy: { order: 'asc' },
                                include: {
                                    _count: { select: { tasks: true } },
                                },
                            },
                            _count: {
                                select: { trainees: true, trainers: true },
                            },
                        },
                    },
                },
            });

            successResponse(res, courses.map(tc => ({
                ...tc.course,
                traineeCount: tc.course._count.trainees,
                trainerCount: tc.course._count.trainers,
            })));
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/trainer/courses/:courseId/trainees - Get course trainees
router.get(
    '/courses/:courseId/trainees',
    authenticate,
    isTrainerOrAbove,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = parseInt(req.params.courseId);

            const trainees = await prisma.courseTrainee.findMany({
                where: { courseId },
                include: {
                    trainee: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                    traineeSubjects: {
                        include: {
                            subject: {
                                select: { id: true, title: true },
                            },
                        },
                    },
                },
            });

            const traineeProgress = await Promise.all(
                trainees.map(async (ct) => {
                    const totalTasks = await prisma.task.count({
                        where: { subject: { courseId } },
                    });

                    const completedTasks = await prisma.traineeTask.count({
                        where: {
                            traineeId: ct.traineeId,
                            task: { subject: { courseId } },
                            status: 'COMPLETED',
                        },
                    });

                    return {
                        ...ct.trainee,
                        status: ct.status,
                        enrolledAt: ct.enrolledAt,
                        subjects: ct.traineeSubjects.map(ts => ({
                            ...ts.subject,
                            status: ts.status,
                            grade: ts.grade,
                            feedback: ts.feedback,
                        })),
                        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                        completedTasks,
                        totalTasks,
                    };
                })
            );

            successResponse(res, traineeProgress);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
