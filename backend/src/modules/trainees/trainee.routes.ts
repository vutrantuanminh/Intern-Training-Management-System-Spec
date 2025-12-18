import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainee } from '../../middleware/rbac.js';

const router = Router();

// GET /api/trainee/dashboard - Get trainee dashboard data
router.get(
    '/dashboard',
    authenticate,
    isTrainee,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const traineeId = req.user!.id;

            // Get enrolled courses
            const enrolledCourses = await prisma.courseTrainee.findMany({
                where: { traineeId },
                include: {
                    course: {
                        include: {
                            subjects: {
                                include: {
                                    tasks: true,
                                },
                            },
                            trainers: {
                                include: {
                                    trainer: {
                                        select: { id: true, fullName: true, avatar: true },
                                    },
                                },
                            },
                        },
                    },
                    traineeSubjects: true,
                },
            });

            // Calculate total tasks from all enrolled courses
            let allTaskIds: number[] = [];
            enrolledCourses.forEach(ct => {
                ct.course.subjects.forEach(subject => {
                    subject.tasks.forEach(task => {
                        allTaskIds.push(task.id);
                    });
                });
            });
            const totalTasks = allTaskIds.length;

            // Get completed tasks count
            const completedTasks = await prisma.traineeTask.count({
                where: { 
                    traineeId, 
                    status: 'COMPLETED',
                    taskId: { in: allTaskIds }
                },
            });

            // Get reports count
            const totalReports = await prisma.dailyReport.count({
                where: { traineeId },
            });

            // Get PRs count
            const totalPRs = await prisma.pullRequest.count({
                where: { traineeId },
            });

            const approvedPRs = await prisma.pullRequest.count({
                where: { traineeId, status: 'APPROVED' },
            });

            // Get upcoming deadlines
            const upcomingTasks = await prisma.task.findMany({
                where: {
                    dueDate: { gte: new Date() },
                    id: { in: allTaskIds },
                    traineeTasks: {
                        none: {
                            traineeId,
                            status: 'COMPLETED',
                        },
                    },
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
                include: {
                    subject: {
                        include: {
                            course: {
                                select: { id: true, title: true },
                            },
                        },
                    },
                },
            });

            // Get recent reports
            const recentReports = await prisma.dailyReport.findMany({
                where: { traineeId },
                orderBy: { date: 'desc' },
                take: 5,
            });

            // Calculate course progress based on tasks
            const courseProgress = await Promise.all(enrolledCourses.map(async (ct) => {
                // Count all tasks in this course
                let courseTotalTasks = 0;
                let courseTaskIds: number[] = [];
                ct.course.subjects.forEach(subject => {
                    subject.tasks.forEach(task => {
                        courseTotalTasks++;
                        courseTaskIds.push(task.id);
                    });
                });

                // Count completed tasks for this course
                const courseCompletedTasks = await prisma.traineeTask.count({
                    where: {
                        traineeId,
                        taskId: { in: courseTaskIds },
                        status: 'COMPLETED',
                    },
                });

                return {
                    id: ct.course.id,
                    title: ct.course.title,
                    status: ct.course.status,
                    startDate: ct.course.startDate,
                    endDate: ct.course.endDate,
                    trainers: ct.course.trainers.map(t => t.trainer),
                    progress: courseTotalTasks > 0 ? Math.round((courseCompletedTasks / courseTotalTasks) * 100) : 0,
                    completedTasks: courseCompletedTasks,
                    totalTasks: courseTotalTasks,
                    traineeStatus: ct.status,
                };
            }));

            successResponse(res, {
                courses: courseProgress,
                statistics: {
                    totalCourses: enrolledCourses.length,
                    activeCourses: enrolledCourses.filter(c => c.course.status === 'IN_PROGRESS').length,
                    completedCourses: enrolledCourses.filter(c => c.course.status === 'FINISHED').length,
                    totalTasks,
                    completedTasks,
                    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    totalReports,
                    totalPRs,
                    approvedPRs,
                },
                upcomingDeadlines: upcomingTasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    dueDate: task.dueDate,
                    course: task.subject.course,
                    subject: { id: task.subject.id, title: task.subject.title },
                })),
                recentReports,
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/trainee/progress - Get overall progress
router.get(
    '/progress',
    authenticate,
    isTrainee,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const traineeId = req.user!.id;

            const enrolledCourses = await prisma.courseTrainee.findMany({
                where: { traineeId },
                include: {
                    course: {
                        include: {
                            subjects: {
                                include: {
                                    tasks: true,
                                },
                            },
                        },
                    },
                    traineeSubjects: true,
                },
            });

            const courseProgress = await Promise.all(
                enrolledCourses.map(async (ct) => {
                    const subjectProgress = await Promise.all(
                        ct.course.subjects.map(async (subject) => {
                            const traineeSubject = ct.traineeSubjects.find(ts => ts.subjectId === subject.id);

                            const taskProgress = await Promise.all(
                                subject.tasks.map(async (task) => {
                                    const traineeTask = await prisma.traineeTask.findUnique({
                                        where: {
                                            traineeId_taskId: { traineeId, taskId: task.id },
                                        },
                                        include: {
                                            files: { select: { id: true, fileName: true, fileUrl: true } },
                                        },
                                    });

                                    return {
                                        id: task.id,
                                        title: task.title,
                                        description: task.description,
                                        dueDate: task.dueDate,
                                        status: traineeTask?.status || 'NOT_STARTED',
                                        completedAt: traineeTask?.completedAt,
                                        files: traineeTask?.files || [],
                                    };
                                })
                            );

                            return {
                                id: subject.id,
                                title: subject.title,
                                description: subject.description,
                                status: traineeSubject?.status || 'NOT_STARTED',
                                grade: traineeSubject?.grade,
                                feedback: traineeSubject?.feedback,
                                completedAt: traineeSubject?.completedAt,
                                tasks: taskProgress,
                            };
                        })
                    );

                    return {
                        id: ct.course.id,
                        title: ct.course.title,
                        description: ct.course.description,
                        status: ct.course.status,
                        startDate: ct.course.startDate,
                        endDate: ct.course.endDate,
                        traineeStatus: ct.status,
                        subjects: subjectProgress,
                    };
                })
            );

            successResponse(res, courseProgress);
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/trainee/courses/:id/progress - Get course progress
router.get(
    '/courses/:id/progress',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const traineeId = req.user!.id;
            const courseId = parseInt(req.params.id);

            const courseTrainee = await prisma.courseTrainee.findUnique({
                where: {
                    courseId_traineeId: { courseId, traineeId },
                },
                include: {
                    course: {
                        include: {
                            subjects: {
                                orderBy: { order: 'asc' },
                                include: {
                                    tasks: {
                                        orderBy: { order: 'asc' },
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
                    },
                    traineeSubjects: true,
                },
            });

            if (!courseTrainee) {
                errorResponse(res, 'Not enrolled in this course', 404);
                return;
            }

            const subjectProgress = await Promise.all(
                courseTrainee.course.subjects.map(async (subject) => {
                    const traineeSubject = courseTrainee.traineeSubjects.find(ts => ts.subjectId === subject.id);

                    const taskProgress = await Promise.all(
                        subject.tasks.map(async (task) => {
                            const traineeTask = await prisma.traineeTask.findUnique({
                                where: {
                                    traineeId_taskId: { traineeId, taskId: task.id },
                                },
                                include: {
                                    files: true,
                                },
                            });

                            return {
                                ...task,
                                traineeStatus: traineeTask?.status || 'NOT_STARTED',
                                completedAt: traineeTask?.completedAt,
                                files: traineeTask?.files || [],
                            };
                        })
                    );

                    const completedTasks = taskProgress.filter(t => t.traineeStatus === 'COMPLETED').length;

                    return {
                        ...subject,
                        traineeStatus: traineeSubject?.status || 'NOT_STARTED',
                        grade: traineeSubject?.grade,
                        feedback: traineeSubject?.feedback,
                        completedAt: traineeSubject?.completedAt,
                        tasks: taskProgress,
                        progress: taskProgress.length > 0 ? Math.round((completedTasks / taskProgress.length) * 100) : 0,
                    };
                })
            );

            const completedSubjects = subjectProgress.filter(s => s.traineeStatus === 'FINISHED').length;
            const overallProgress = subjectProgress.length > 0
                ? Math.round((completedSubjects / subjectProgress.length) * 100)
                : 0;

            successResponse(res, {
                ...courseTrainee.course,
                traineeStatus: courseTrainee.status,
                trainers: courseTrainee.course.trainers.map(t => t.trainer),
                subjects: subjectProgress,
                overallProgress,
                completedSubjects,
                totalSubjects: subjectProgress.length,
            });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/trainee/subjects/:id/complete - Complete subject
router.post(
    '/subjects/:id/complete',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const traineeId = req.user!.id;
            const subjectId = parseInt(req.params.id);

            const subject = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: {
                    tasks: true,
                    course: {
                        include: {
                            trainees: {
                                where: { traineeId },
                            },
                        },
                    },
                },
            });

            if (!subject) {
                errorResponse(res, 'Subject not found', 404);
                return;
            }

            if (subject.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Subject is not in progress', 400);
                return;
            }

            const courseTrainee = subject.course.trainees[0];
            if (!courseTrainee) {
                errorResponse(res, 'Not enrolled in this course', 403);
                return;
            }

            // Mark all incomplete tasks as completed
            await prisma.traineeTask.updateMany({
                where: {
                    traineeId,
                    taskId: { in: subject.tasks.map(t => t.id) },
                    status: { not: 'COMPLETED' },
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            // Mark trainee subject as finished
            await prisma.traineeSubject.updateMany({
                where: {
                    courseTraineeId: courseTrainee.id,
                    subjectId,
                },
                data: {
                    status: 'FINISHED',
                    completedAt: new Date(),
                },
            });

            // Check if all trainees have completed this subject
            const allTraineesCompleted = await prisma.traineeSubject.count({
                where: {
                    subjectId,
                    status: { not: 'FINISHED' },
                },
            }) === 0;

            // Auto-finish subject if all trainees completed
            if (allTraineesCompleted) {
                await prisma.subject.update({
                    where: { id: subjectId },
                    data: {
                        status: 'FINISHED',
                        endDate: new Date(),
                    },
                });
            }

            // Check if all subjects in course are completed by this trainee
            const allSubjectsCompleted = await prisma.traineeSubject.count({
                where: {
                    courseTraineeId: courseTrainee.id,
                    status: { not: 'FINISHED' },
                },
            }) === 0;

            // Check if all trainees have completed all subjects
            if (allSubjectsCompleted) {
                const anyIncomplete = await prisma.traineeSubject.count({
                    where: {
                        subject: { courseId: subject.courseId },
                        status: { not: 'FINISHED' },
                    },
                });

                if (anyIncomplete === 0) {
                    await prisma.course.update({
                        where: { id: subject.courseId },
                        data: {
                            status: 'FINISHED',
                            endDate: new Date(),
                        },
                    });
                }
            }

            successResponse(res, null, 'Subject completed successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
