import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { prisma } from '../config/database.js';

type Role = 'ADMIN' | 'SUPERVISOR' | 'TRAINER' | 'TRAINEE';

// Role-Based Access Control middleware
export const requireRoles = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            errorResponse(res, 'Authentication required', 401);
            return;
        }

        const userRoles = req.user.roles as Role[];
        const hasRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
            errorResponse(res, 'Insufficient permissions', 403);
            return;
        }

        next();
    };
};

// Check if user is admin
export const isAdmin = requireRoles('ADMIN');

// Check if user is supervisor or admin
export const isSupervisorOrAdmin = requireRoles('ADMIN', 'SUPERVISOR');

// Check if user is trainer, supervisor, or admin
export const isTrainerOrAbove = requireRoles('ADMIN', 'SUPERVISOR', 'TRAINER');

// Check if user is trainee
export const isTrainee = requireRoles('TRAINEE');

// Check if user is trainer of a specific course
export const isCourseTrainer = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        errorResponse(res, 'Authentication required', 401);
        return;
    }

    const userRoles = req.user.roles as Role[];

    // Admin and Supervisor have full access
    if (userRoles.includes('ADMIN') || userRoles.includes('SUPERVISOR')) {
        next();
        return;
    }

    // Get course ID from params
    const courseId = parseInt(req.params.courseId || req.params.id);

    if (isNaN(courseId)) {
        errorResponse(res, 'Invalid course ID', 400);
        return;
    }

    // Check if user is trainer of this course
    const isCourseTrainer = await prisma.courseTrainer.findUnique({
        where: {
            courseId_trainerId: {
                courseId,
                trainerId: req.user.id,
            },
        },
    });

    if (!isCourseTrainer) {
        errorResponse(res, 'You are not a trainer of this course', 403);
        return;
    }

    next();
};

// Check if user is trainee of a specific course
export const isCourseTrainee = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        errorResponse(res, 'Authentication required', 401);
        return;
    }

    const courseId = parseInt(req.params.courseId || req.params.id);

    if (isNaN(courseId)) {
        errorResponse(res, 'Invalid course ID', 400);
        return;
    }

    const isEnrolled = await prisma.courseTrainee.findUnique({
        where: {
            courseId_traineeId: {
                courseId,
                traineeId: req.user.id,
            },
        },
    });

    if (!isEnrolled) {
        errorResponse(res, 'You are not enrolled in this course', 403);
        return;
    }

    next();
};

// Check if user has access to course (trainer or trainee)
export const hasCourseAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        errorResponse(res, 'Authentication required', 401);
        return;
    }

    const userRoles = req.user.roles as Role[];

    // Admin and Supervisor have full access
    if (userRoles.includes('ADMIN') || userRoles.includes('SUPERVISOR')) {
        next();
        return;
    }

    const courseId = parseInt(req.params.courseId || req.params.id);

    if (isNaN(courseId)) {
        errorResponse(res, 'Invalid course ID', 400);
        return;
    }

    // Check if trainer
    const isTrainer = await prisma.courseTrainer.findUnique({
        where: {
            courseId_trainerId: {
                courseId,
                trainerId: req.user.id,
            },
        },
    });

    if (isTrainer) {
        next();
        return;
    }

    // Check if trainee
    const isTrainee = await prisma.courseTrainee.findUnique({
        where: {
            courseId_traineeId: {
                courseId,
                traineeId: req.user.id,
            },
        },
    });

    if (isTrainee) {
        next();
        return;
    }

    errorResponse(res, 'You do not have access to this course', 403);
};
