import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { validateParams, idParamSchema } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { isTrainee } from '../../middleware/rbac.js';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = Router();

// S3 client (MinIO for local dev)
const s3Client = new S3Client({
    region: env.awsRegion,
    endpoint: env.awsS3Endpoint,
    credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO
});

// Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/zip',
            'text/plain', 'text/html', 'text/css', 'text/javascript',
            'application/javascript', 'application/json',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
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
                const key = `tasks/${taskId}/trainee_${traineeId}/${fileId}${ext}`;

                // Upload to S3
                await s3Client.send(new PutObjectCommand({
                    Bucket: env.awsS3Bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));

                const fileUrl = env.awsS3Endpoint
                    ? `${env.awsS3Endpoint}/${env.awsS3Bucket}/${key}`
                    : `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;

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

            // Delete from S3
            const key = file.fileUrl.split('/').slice(-3).join('/');
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: env.awsS3Bucket,
                    Key: key,
                }));
            } catch {
                console.warn('Failed to delete file from S3:', key);
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
