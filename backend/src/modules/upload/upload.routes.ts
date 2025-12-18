import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// S3 client
const s3Client = new S3Client({
    region: env.awsRegion,
    endpoint: env.awsS3Endpoint,
    credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
    },
    forcePathStyle: true,
});

// Multer config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// POST /api/upload/avatar - Upload avatar
router.post(
    '/avatar',
    authenticate,
    uploadLimiter,
    upload.single('avatar'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const file = req.file;
            if (!file) {
                errorResponse(res, 'No file uploaded', 400);
                return;
            }

            const userId = req.user!.id;
            const fileId = uuidv4();
            const ext = path.extname(file.originalname) || '.jpg';
            const key = `avatars/${userId}/${fileId}${ext}`;

            // Upload to S3
            await s3Client.send(new PutObjectCommand({
                Bucket: env.awsS3Bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            const avatarUrl = env.awsS3Endpoint
                ? `${env.awsS3Endpoint}/${env.awsS3Bucket}/${key}`
                : `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;

            // Update user avatar
            await prisma.user.update({
                where: { id: userId },
                data: { avatar: avatarUrl },
            });

            successResponse(res, { avatarUrl }, 'Avatar uploaded successfully');
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/upload/avatar - Delete avatar
router.delete(
    '/avatar',
    authenticate,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (user?.avatar) {
                // Try to delete from S3
                const key = user.avatar.split('/').slice(-2).join('/');
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: env.awsS3Bucket,
                        Key: `avatars/${key}`,
                    }));
                } catch {
                    console.warn('Failed to delete avatar from S3');
                }
            }

            // Clear avatar in database
            await prisma.user.update({
                where: { id: userId },
                data: { avatar: null },
            });

            successResponse(res, null, 'Avatar deleted successfully');
        } catch (error) {
            next(error);
        }
    }
);

export default router;
