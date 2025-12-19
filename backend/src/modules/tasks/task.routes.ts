import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainee } from '../../middleware/rbac.js';
import multer from 'multer';
import { env } from '../../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

// Create uploads directory if not exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            // Archives
            'application/zip', 'application/x-zip-compressed',
            'application/x-rar-compressed', 'application/x-7z-compressed',
            // Text/Code
            'text/plain', 'text/html', 'text/css', 'text/javascript',
            'application/javascript', 'application/json', 'application/xml',
            // Source code files
            'text/x-c', 'text/x-csrc', 'text/x-c++src', 'text/x-chdr', 'text/x-c++hdr',
            'text/x-python', 'text/x-java-source', 'text/x-csharp',
            'application/x-python-code', 'application/x-java',
            // Videos
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    },
});

// POST /api/tasks/:id/complete - Complete task
router.post(
    '/:id/complete',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);
            const traineeId = req.user!.id;

            // Find task and subject
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    subject: true,
                },
            });

            if (!task) {
                errorResponse(res, 'Task not found', 404);
                return;
            }

            // Check if subject is in progress
            if (task.subject.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Subject is not in progress', 400);
                return;
            }

            // Check if trainee is enrolled
            const courseTrainee = await prisma.courseTrainee.findFirst({
                where: {
                    courseId: task.subject.courseId,
                    traineeId,
                },
            });

            if (!courseTrainee) {
                errorResponse(res, 'You are not enrolled in this course', 403);
                return;
            }

            // Upsert trainee task
            await prisma.traineeTask.upsert({
                where: {
                    traineeId_taskId: { traineeId, taskId },
                },
                update: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
                create: {
                    traineeId,
                    taskId,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            // Check if all tasks in subject are completed
            const subjectTasks = await prisma.task.findMany({
                where: { subjectId: task.subjectId },
            });

            const completedTasks = await prisma.traineeTask.count({
                where: {
                    traineeId,
                    taskId: { in: subjectTasks.map(t => t.id) },
                    status: 'COMPLETED',
                },
            });

            // Update trainee subject status
            const traineeSubject = await prisma.traineeSubject.findFirst({
                where: {
                    courseTraineeId: courseTrainee.id,
                    subjectId: task.subjectId,
                },
            });

            if (traineeSubject && traineeSubject.status !== 'FINISHED') {
                await prisma.traineeSubject.update({
                    where: { id: traineeSubject.id },
                    data: { status: 'IN_PROGRESS' },
                });
            }

            successResponse(res, {
                completedTasks,
                totalTasks: subjectTasks.length,
            }, 'Task completed successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/tasks/:id/uncomplete - Uncomplete task
router.post(
    '/:id/uncomplete',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);
            const traineeId = req.user!.id;

            // Find task and subject
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: { subject: true },
            });

            if (!task) {
                errorResponse(res, 'Task not found', 404);
                return;
            }

            // Check if subject is in progress
            if (task.subject.status !== 'IN_PROGRESS') {
                errorResponse(res, 'Cannot uncomplete task - subject is not in progress', 400);
                return;
            }

            // Update trainee task
            const traineeTask = await prisma.traineeTask.findUnique({
                where: {
                    traineeId_taskId: { traineeId, taskId },
                },
            });

            if (!traineeTask) {
                errorResponse(res, 'Task not started', 404);
                return;
            }

            await prisma.traineeTask.update({
                where: { id: traineeTask.id },
                data: {
                    status: 'IN_PROGRESS',
                    completedAt: null,
                },
            });

            successResponse(res, null, 'Task uncompleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/tasks/:id/upload - Upload evidence files
router.post(
    '/:id/upload',
    authenticate,
    isTrainee,
    validateParams(idParamSchema),
    upload.array('files', 10),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);
            const traineeId = req.user!.id;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                errorResponse(res, 'No files uploaded', 400);
                return;
            }

            // Find or create trainee task
            let traineeTask = await prisma.traineeTask.findUnique({
                where: {
                    traineeId_taskId: { traineeId, taskId },
                },
            });

            if (!traineeTask) {
                traineeTask = await prisma.traineeTask.create({
                    data: {
                        traineeId,
                        taskId,
                        status: 'IN_PROGRESS',
                    },
                });
            }


            const uploadedFiles = [];

            for (const file of files) {
                const fileId = uuidv4();
                const ext = path.extname(file.originalname);
                const relativePath = `tasks/${taskId}/trainee_${traineeId}`;
                const fullDir = path.join(uploadsDir, relativePath);

                // Create directory if not exists
                if (!fs.existsSync(fullDir)) {
                    fs.mkdirSync(fullDir, { recursive: true });
                }

                // Save file to local filesystem
                const fileName = `${fileId}${ext}`;
                const fullPath = path.join(fullDir, fileName);
                fs.writeFileSync(fullPath, file.buffer);

                // Generate URL (for local development)
                const fileUrl = `/uploads/${relativePath}/${fileName}`;

                // Save file record
                const taskFile = await prisma.taskFile.create({
                    data: {
                        traineeTaskId: traineeTask.id,
                        fileName: file.originalname,
                        fileUrl,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    },
                });

                uploadedFiles.push(taskFile);
            }

            successResponse(res, uploadedFiles, 'Files uploaded successfully');
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/tasks/:id/files - Get task files
router.get(
    '/:id/files',
    authenticate,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);
            const traineeId = req.query.traineeId
                ? parseInt(req.query.traineeId as string)
                : req.user!.id;

            const traineeTask = await prisma.traineeTask.findUnique({
                where: {
                    traineeId_taskId: { traineeId, taskId },
                },
                include: {
                    files: {
                        orderBy: { uploadedAt: 'desc' },
                    },
                },
            });

            if (!traineeTask) {
                successResponse(res, []);
                return;
            }

            successResponse(res, traineeTask.files);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/tasks/:id/files/:fileId - Delete task file
router.delete(
    '/:id/files/:fileId',
    authenticate,
    isTrainee,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id);
            const fileId = parseInt(req.params.fileId);
            const traineeId = req.user!.id;

            const file = await prisma.taskFile.findFirst({
                where: {
                    id: fileId,
                    traineeTask: {
                        taskId,
                        traineeId,
                    },
                },
            });

            if (!file) {
                errorResponse(res, 'File not found', 404);
                return;
            }

            // Delete from local filesystem
            const filePath = path.join(process.cwd(), file.fileUrl);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.warn('Failed to delete file from filesystem:', filePath, error);
            }

            // Delete from database
            await prisma.taskFile.delete({
                where: { id: fileId },
            });

            successResponse(res, null, 'File deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
