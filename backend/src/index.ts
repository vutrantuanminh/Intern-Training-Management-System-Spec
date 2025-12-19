import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import path from 'path';

import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setCsrfToken, verifyCsrfToken } from './middleware/csrf.js';
import { defaultLimiter } from './middleware/rateLimit.js';
import { initializeSocket } from './socket/index.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import subjectRoutes from './modules/subjects/subject.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import traineeRoutes from './modules/trainees/trainee.routes.js';
import trainerRoutes from './modules/trainers/trainer.routes.js';
import supervisorRoutes from './modules/supervisors/supervisor.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import prRoutes from './modules/pull-requests/pr.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));

// CSRF protection - DISABLED FOR DEVELOPMENT
app.use(setCsrfToken);
// app.use('/api', verifyCsrfToken); // TODO: Re-enable in production

// Rate limiting
app.use('/api', defaultLimiter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', subjectRoutes); // Mixed routes
app.use('/api/tasks', taskRoutes);
app.use('/api/trainee', traineeRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/daily-reports', reportRoutes);
app.use('/api/pull-requests', prRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Shutting down gracefully...');

    await prisma.$disconnect();
    if (redis) await redis.disconnect();

    httpServer.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('✅ Database connected');

        // Connect to Redis
        if (redis) {
            if (redis.status === 'wait') {
                await redis.connect();
            }
            console.log('✅ Redis connected');
        }

        // Start HTTP server
        httpServer.listen(env.port, () => {
            console.log(`
🚀 Server is running!
   - API: http://localhost:${env.port}
   - Socket: ws://localhost:${env.port}
   - Environment: ${env.nodeEnv}
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export { app, httpServer };
