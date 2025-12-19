import dotenv from 'dotenv';
dotenv.config();

export const env = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Kafka
    kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    kafkaClientId: process.env.KAFKA_CLIENT_ID || 'tms-backend',

    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // AWS
    awsRegion: process.env.AWS_REGION || 'ap-southeast-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    awsS3Bucket: process.env.AWS_S3_BUCKET || 'tms-uploads',
    awsS3Endpoint: process.env.AWS_S3_ENDPOINT,
    awsSesFromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@localhost.com',

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    supabaseBucket: process.env.SUPABASE_BUCKET || 'task-files',

    // SMTP
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || 'Training Management System <noreply@localhost.com>',

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Cookie
    cookieSecret: process.env.COOKIE_SECRET || 'dev-secret',

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // PeerJS
    peerServerPort: parseInt(process.env.PEER_SERVER_PORT || '9001', 10),

    // Helpers
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
