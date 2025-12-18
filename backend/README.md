# Training Management System - Backend

A comprehensive backend API for the Training Management System built with Node.js, Express, TypeScript, PostgreSQL, Redis, Kafka, and Socket.io.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

### Development Setup

1. **Start infrastructure services:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database:**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 🔐 Test Accounts

All test accounts use password: `Admin@123`

| Role | Email |
|------|-------|
| Admin | admin@tms.com |
| Supervisor | supervisor@tms.com |
| Trainer | trainer@tms.com |
| Trainee | trainee1@tms.com |
| Trainee | trainee2@tms.com |

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Admin only)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh JWT
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - List users (Admin)
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/clone` - Clone course
- `POST /api/courses/:id/start` - Start course
- `POST /api/courses/:id/finish` - Finish course
- `POST /api/courses/:id/trainers` - Assign trainers
- `POST /api/courses/:id/trainees` - Add trainees

### Subjects & Tasks
- `GET /api/courses/:courseId/subjects` - List subjects
- `POST /api/courses/:courseId/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject
- `POST /api/tasks/:id/complete` - Complete task
- `POST /api/tasks/:id/upload` - Upload evidence

### Daily Reports & Pull Requests
- `GET /api/daily-reports` - List reports
- `POST /api/daily-reports` - Create report
- `GET /api/pull-requests` - List PRs
- `POST /api/pull-requests` - Create PR
- `PUT /api/pull-requests/:id/approve` - Approve PR

### Chat & Notifications
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/rooms` - Create room
- `GET /api/chat/rooms/:id/messages` - Get messages
- `GET /api/notifications` - Get notifications

## 🔌 WebSocket Events

Connect to `ws://localhost:5000` with auth token.

### Chat Events
- `join_room` / `leave_room` - Room management
- `send_message` / `new_message` - Messaging
- `typing` / `stop_typing` - Typing indicators

### Notification Events
- `notification` - Real-time notifications
- `user_online` / `user_offline` - Online status

## 🏗️ Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Cache:** Redis 7
- **Message Queue:** Kafka
- **WebSocket:** Socket.io
- **File Storage:** S3/MinIO
- **Email:** AWS SES / SMTP

## 📦 Docker Services

```bash
docker-compose up -d
```

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Message Queue |
| MinIO | 9000/9001 | File Storage |
| MailHog | 1025/8025 | Email Testing |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

## 🚢 Deployment

The project includes GitHub Actions CI/CD for AWS deployment:

1. Push to `main` branch triggers:
   - Lint & type check
   - Run tests
   - Build Docker image
   - Push to ECR
   - Deploy to ECS

## 📄 License

MIT
