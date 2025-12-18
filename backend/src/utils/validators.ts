import { z } from 'zod';

// Common validators
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// Auth schemas
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    roleNames: z.array(z.enum(['ADMIN', 'SUPERVISOR', 'TRAINER', 'TRAINEE'])).min(1),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

// User schemas
export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    avatar: z.string().url().optional(),
});

export const createUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(2),
    roleNames: z.array(z.enum(['ADMIN', 'SUPERVISOR', 'TRAINER', 'TRAINEE'])).min(1),
});

export const updateUserSchema = z.object({
    email: emailSchema.optional(),
    fullName: z.string().min(2).optional(),
    roleNames: z.array(z.enum(['ADMIN', 'SUPERVISOR', 'TRAINER', 'TRAINEE'])).optional(),
    isActive: z.boolean().optional(),
});

// Course schemas
export const createCourseSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    subjects: z.array(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        order: z.number().int().positive().optional(),
        tasks: z.array(z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            dueDate: z.string().datetime().optional(),
            order: z.number().int().positive().optional(),
        })).min(1, 'Each subject must have at least 1 task'),
    })).min(1, 'Course must have at least 1 subject'),
    trainerIds: z.array(z.number().int().positive()).optional(),
});

export const updateCourseSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const addTraineesSchema = z.object({
    traineeIds: z.array(z.number().int().positive()).min(1),
});

export const addTrainersSchema = z.object({
    trainerIds: z.array(z.number().int().positive()).min(1),
});

export const updateTraineeStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'PASS', 'FAIL', 'RESIGN']),
});

// Subject schemas
export const createSubjectSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().positive().optional(),
    tasks: z.array(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        order: z.number().int().positive().optional(),
    })).optional().default([]),
});

export const updateSubjectSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const gradeTraineeSchema = z.object({
    grade: z.number().min(0).max(100),
    feedback: z.string().optional(),
});

// Daily report schemas
export const createReportSchema = z.object({
    content: z.string().min(1, 'Content is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const updateReportSchema = z.object({
    content: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createTemplateSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
});

// Pull request schemas
export const createPRSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    repoUrl: z.string().url('Invalid repository URL'),
    taskId: z.number().int().positive().optional(),
});

export const updatePRSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
});

export const rejectPRSchema = z.object({
    reason: z.string().optional(),
});

export const addPRCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required'),
});

// Chat schemas
export const createRoomSchema = z.object({
    name: z.string().optional(),
    participantIds: z.array(z.number().int().positive()).min(1),
    isGroup: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
    content: z.string().min(1, 'Message content is required'),
});

// Pagination schema
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
