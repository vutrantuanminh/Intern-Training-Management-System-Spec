import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import { validateQuery, validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isSupervisorOrAdmin } from '../../middleware/rbac.js';
import { paginationSchema } from '../../utils/validators.js';
import { z } from 'zod';

const router = Router();

// GET /api/supervisor/dashboard - Get comprehensive dashboard data
router.get(
    '/dashboard',
    authenticate,
    isSupervisorOrAdmin,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get all counts in parallel
            const [
                totalCourses,
                activeCourses,
                upcomingCourses,
                completedCourses,
                totalTrainees,
                activeTrainees,
                passedTrainees,
                totalTrainers,
                totalSupervisors,
                recentReports,
                recentPRs,
                upcomingTasks,
                topPerformers,
                recentEnrollments,
            ] = await Promise.all([
                // Course counts
                prisma.course.count(),
                prisma.course.count({ where: { status: 'IN_PROGRESS' } }),
                prisma.course.count({ where: { status: 'NOT_STARTED' } }),
                prisma.course.count({ where: { status: 'FINISHED' } }),

                // Trainee counts
                prisma.user.count({ where: { roles: { some: { role: { name: 'TRAINEE' } } }, isActive: true } }),
                prisma.courseTrainee.count({ where: { status: 'ACTIVE' } }),
                prisma.courseTrainee.count({ where: { status: 'PASS' } }),

                // Staff counts
                prisma.user.count({ where: { roles: { some: { role: { name: 'TRAINER' } } }, isActive: true } }),
                prisma.user.count({ where: { roles: { some: { role: { name: { in: ['SUPERVISOR', 'ADMIN'] } } } }, isActive: true } }),

                // Recent daily reports (last 7 days)
                prisma.dailyReport.findMany({
                    where: { createdAt: { gte: oneWeekAgo } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        trainee: { select: { id: true, fullName: true, avatar: true } },
                    },
                }),

                // Recent PRs (last 7 days)
                prisma.pullRequest.findMany({
                    where: { createdAt: { gte: oneWeekAgo } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        trainee: { select: { id: true, fullName: true, avatar: true } },
                        task: { select: { id: true, title: true } },
                    },
                }),

                // Upcoming tasks (due in next 7 days)
                prisma.task.findMany({
                    where: {
                        dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
                    },
                    orderBy: { dueDate: 'asc' },
                    take: 10,
                    include: {
                        subject: { select: { id: true, title: true, courseId: true } },
                    },
                }),

                // Top performers (trainees with highest grades)
                prisma.traineeSubject.groupBy({
                    by: ['courseTraineeId'],
                    _avg: { grade: true },
                    where: { grade: { not: null } },
                    orderBy: { _avg: { grade: 'desc' } },
                    take: 5,
                }),

                // Recent enrollments
                prisma.courseTrainee.findMany({
                    where: { enrolledAt: { gte: oneWeekAgo } },
                    orderBy: { enrolledAt: 'desc' },
                    take: 10,
                    include: {
                        trainee: { select: { id: true, fullName: true, avatar: true } },
                        course: { select: { id: true, title: true } },
                    },
                }),
            ]);

            // Get top performers details
            const topPerformerIds = topPerformers.map(tp => tp.courseTraineeId);
            const topPerformerDetails = await prisma.courseTrainee.findMany({
                where: { id: { in: topPerformerIds } },
                include: {
                    trainee: { select: { id: true, fullName: true, avatar: true, email: true } },
                    course: { select: { id: true, title: true } },
                },
            });

            const topPerformersWithGrades = topPerformers.map(tp => {
                const details = topPerformerDetails.find(d => d.id === tp.courseTraineeId);
                return {
                    trainee: details?.trainee,
                    course: details?.course,
                    avgGrade: Math.round(tp._avg.grade || 0),
                };
            });

            // Active courses list
            const activeCoursesList = await prisma.course.findMany({
                where: { status: 'IN_PROGRESS' },
                take: 5,
                orderBy: { startDate: 'desc' },
                include: {
                    _count: { select: { trainees: true, subjects: true } },
                    trainers: {
                        include: { trainer: { select: { id: true, fullName: true } } },
                    },
                },
            });

            // Calculate completion rates for active courses
            const courseProgressPromises = activeCoursesList.map(async (course) => {
                const totalTasks = await prisma.task.count({ where: { subject: { courseId: course.id } } });
                const completedTasks = await prisma.traineeTask.count({
                    where: { task: { subject: { courseId: course.id } }, status: 'COMPLETED' },
                });
                return {
                    ...course,
                    traineeCount: course._count.trainees,
                    subjectCount: course._count.subjects,
                    trainers: course.trainers.map(t => t.trainer),
                    progress: totalTasks > 0 ? Math.round((completedTasks / (totalTasks * course._count.trainees || 1)) * 100) : 0,
                };
            });
            const coursesWithProgress = await Promise.all(courseProgressPromises);

            successResponse(res, {
                stats: {
                    courses: { total: totalCourses, active: activeCourses, upcoming: upcomingCourses, completed: completedCourses },
                    trainees: { total: totalTrainees, active: activeTrainees, passed: passedTrainees },
                    staff: { trainers: totalTrainers, supervisors: totalSupervisors },
                },
                activeCourses: coursesWithProgress,
                recentActivity: {
                    reports: recentReports.map(r => ({
                        id: r.id,
                        trainee: r.trainee,
                        content: r.content.substring(0, 100) + (r.content.length > 100 ? '...' : ''),
                        date: r.date,
                        createdAt: r.createdAt,
                    })),
                    pullRequests: recentPRs.map(pr => ({
                        id: pr.id,
                        trainee: pr.trainee,
                        task: pr.task,
                        title: pr.title,
                        status: pr.status,
                        createdAt: pr.createdAt,
                    })),
                    enrollments: recentEnrollments.map(e => ({
                        trainee: e.trainee,
                        course: e.course,
                        enrolledAt: e.enrolledAt,
                    })),
                },
                upcomingTasks: upcomingTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    dueDate: t.dueDate,
                    subject: t.subject,
                })),
                topPerformers: topPerformersWithGrades,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Trainee list query
const traineeListSchema = paginationSchema.extend({
    courseId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'PASS', 'FAIL', 'RESIGN']).optional(),
});

// GET /api/supervisor/trainees - Get all trainees
router.get(
    '/trainees',
    authenticate,
    isSupervisorOrAdmin,
    validateQuery(traineeListSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, courseId, status } = req.query as unknown as z.infer<typeof traineeListSchema>;
            const skip = (page - 1) * limit;

            const where: Record<string, unknown> = {
                roles: {
                    some: {
                        role: { name: 'TRAINEE' },
                    },
                },
            };

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { fullName: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (courseId || status) {
                where.courseTrainees = {
                    some: {
                        ...(courseId && { courseId }),
                        ...(status && { status }),
                    },
                };
            }

            const [trainees, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatar: true,
                        isActive: true,
                        createdAt: true,
                        courseTrainees: {
                            include: {
                                course: {
                                    select: { id: true, title: true, status: true },
                                },
                            },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            const traineeData = trainees.map(t => ({
                ...t,
                enrolledCourses: t.courseTrainees.map(ct => ({
                    ...ct.course,
                    traineeStatus: ct.status,
                    enrolledAt: ct.enrolledAt,
                })),
            }));

            paginatedResponse(res, traineeData, { page, limit, total });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/supervisor/trainee/:id/details - Get trainee details
router.get(
    '/trainee/:id/details',
    authenticate,
    isSupervisorOrAdmin,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const traineeId = parseInt(req.params.id);

            const trainee = await prisma.user.findUnique({
                where: { id: traineeId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    isActive: true,
                    createdAt: true,
                    courseTrainees: {
                        include: {
                            course: {
                                include: {
                                    subjects: true,
                                },
                            },
                            traineeSubjects: {
                                include: {
                                    subject: {
                                        select: { id: true, title: true },
                                    },
                                },
                            },
                        },
                    },
                    dailyReports: {
                        orderBy: { date: 'desc' },
                        take: 10,
                    },
                    pullRequests: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        include: {
                            task: {
                                select: { id: true, title: true },
                            },
                        },
                    },
                },
            });

            if (!trainee) {
                successResponse(res, null, 'Trainee not found');
                return;
            }

            // Calculate overall progress
            const courses = await Promise.all(
                trainee.courseTrainees.map(async (ct) => {
                    const totalTasks = await prisma.task.count({
                        where: { subject: { courseId: ct.courseId } },
                    });

                    const completedTasks = await prisma.traineeTask.count({
                        where: {
                            traineeId,
                            task: { subject: { courseId: ct.courseId } },
                            status: 'COMPLETED',
                        },
                    });

                    return {
                        id: ct.course.id,
                        title: ct.course.title,
                        status: ct.course.status,
                        traineeStatus: ct.status,
                        enrolledAt: ct.enrolledAt,
                        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                        subjects: ct.traineeSubjects.map(ts => ({
                            ...ts.subject,
                            status: ts.status,
                            grade: ts.grade,
                            feedback: ts.feedback,
                        })),
                    };
                })
            );

            successResponse(res, {
                ...trainee,
                courses,
                recentReports: trainee.dailyReports,
                recentPRs: trainee.pullRequests,
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/supervisor/trainee-statistics - Get trainee statistics
router.get(
    '/trainee-statistics',
    authenticate,
    isSupervisorOrAdmin,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const totalTrainees = await prisma.user.count({
                where: {
                    roles: {
                        some: { role: { name: 'TRAINEE' } },
                    },
                },
            });

            const activeTrainees = await prisma.courseTrainee.count({
                where: { status: 'ACTIVE' },
            });

            const passedTrainees = await prisma.courseTrainee.count({
                where: { status: 'PASS' },
            });

            const failedTrainees = await prisma.courseTrainee.count({
                where: { status: 'FAIL' },
            });

            const resignedTrainees = await prisma.courseTrainee.count({
                where: { status: 'RESIGN' },
            });

            successResponse(res, {
                total: totalTrainees,
                active: activeTrainees,
                passed: passedTrainees,
                failed: failedTrainees,
                resigned: resignedTrainees,
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/supervisor/supervisors - Get all supervisors
router.get(
    '/supervisors',
    authenticate,
    isSupervisorOrAdmin,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const supervisors = await prisma.user.findMany({
                where: {
                    roles: {
                        some: {
                            role: { name: { in: ['SUPERVISOR', 'ADMIN'] } },
                        },
                    },
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    createdAt: true,
                    roles: {
                        include: { role: true },
                    },
                    _count: {
                        select: { createdCourses: true },
                    },
                },
            });

            successResponse(res, supervisors.map(s => ({
                ...s,
                roles: s.roles.map(ur => ur.role),
                coursesCreated: s._count.createdCourses,
            })));
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/supervisor/trainers - Get all trainers (for assigning to courses)
router.get(
    '/trainers',
    authenticate,
    isSupervisorOrAdmin,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const trainers = await prisma.user.findMany({
                where: {
                    isActive: true,
                    roles: {
                        some: {
                            role: { name: { in: ['TRAINER', 'SUPERVISOR'] } },
                        },
                    },
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatar: true,
                    roles: {
                        include: { role: true },
                    },
                },
            });

            successResponse(res, trainers.map(t => ({
                ...t,
                roles: t.roles.map(ur => ur.role),
            })));
        } catch (error) {
            next(error);
        }
    }
);

export default router;
