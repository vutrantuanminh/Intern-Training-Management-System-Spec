# 🎓 Training Management System

A comprehensive full-stack web application for managing intern training programs with real-time features, role-based access control, and cloud deployment.

## 🌐 Live Demo

- **Frontend**: https://intern-training-management-system-s.vercel.app
- **Backend API**: https://intern-training-management-system-spec-production.up.railway.app/api

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tms.com | Admin@123 |
| Supervisor | supervisor1@tms.com | Admin@123 |
| Trainer | trainer1@tms.com | Admin@123 |
| Trainee | trainee1@tms.com | Admin@123 |

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## ✨ Features

### Core Functionality
- ✅ **User Management**: CRUD operations for admins, supervisors, trainers, and trainees
- ✅ **Course Management**: Create, assign, and track training courses
- ✅ **Task Submission**: File upload with evidence tracking
- ✅ **Grading System**: Trainers can grade and provide feedback
- ✅ **Pull Request Management**: GitHub integration for code reviews
- ✅ **Real-time Chat**: Socket.io powered messaging
- ✅ **Notifications**: Real-time updates for assignments and deadlines

### Advanced Features
- ✅ **Role-Based Access Control (RBAC)**: 4 roles with granular permissions
- ✅ **Responsive Design**: Mobile, tablet, and desktop support
- ✅ **File Upload**: Local storage with future Supabase Storage migration
- ✅ **Dashboard Analytics**: Progress tracking and statistics
- ✅ **WebRTC Video Calls**: Peer-to-peer mentoring sessions

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Video**: PeerJS (WebRTC)
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **File Upload**: Multer (local storage)
- **Security**: Helmet, CORS, CSRF, Rate Limiting
- **Deployment**: Railway

### Infrastructure
- **Database**: Railway PostgreSQL
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

### Additional Technologies
- **Redis**: Caching and rate limiting (optional)
- **Kafka**: Event streaming (optional)
- **Zod**: Schema validation
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                    │
│  React + TypeScript + Tailwind CSS + Socket.io Client       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/WSS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Railway)                       │
│  Express.js + TypeScript + Socket.io + Prisma               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL      │    │  File Storage    │
│  (Railway)       │    │  (Local/Railway) │
└──────────────────┘    └──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/vutrantuanminh/Intern-Training-Management-System-Spec.git
cd Intern-Training-Management-System-Spec
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup

```bash
# From project root
npm install

# Setup environment variables
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Create Railway Account**: https://railway.app
2. **Create New Project** → Deploy from GitHub repo
3. **Add PostgreSQL Database**:
   - New → Database → PostgreSQL
   - Railway auto-generates `DATABASE_URL`

4. **Configure Environment Variables**:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-random-64-chars>
JWT_REFRESH_SECRET=<generate-random-64-chars>
FRONTEND_URL=https://your-app.vercel.app
COOKIE_SECRET=<generate-random-32-chars>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

Notes:
- `JWT_EXPIRES_IN` can be used to override the access token TTL (default: `10h`).
- `JWT_REFRESH_EXPIRES_IN` controls refresh token TTL (default: `7d`).

5. **Deploy Settings**:
   - Root Directory: `/backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

6. **Generate Domain**: Settings → Networking → Generate Domain

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: https://vercel.com
2. **Import Project** from GitHub
3. **Configure Build Settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add Environment Variable**:
```bash
VITE_API_URL=https://your-backend.up.railway.app/api
```

5. **Deploy** → Vercel auto-deploys on every push to main

---

## 🧪 Testing

### Technology Verification

#### 1. WebRTC/WebSocket
```bash
# Test Socket.io connection
# Open browser console on frontend
# Look for: "✅ Socket.io connected"
```

#### 2. Authentication & RBAC
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tms.com","password":"Admin@123"}'

# Expected: JWT token returned
```

#### 3. File Upload
1. Login as trainee
2. Navigate to My Courses → Task
3. Upload file (.pdf, .png, .c, etc.)
4. Check `backend/uploads/tasks/` for uploaded file

#### 4. Responsive Design
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Test: Mobile (375px), Tablet (768px), Desktop (1920px)

#### 5. Rate Limiting
```bash
# Spam requests (>100 in 15 minutes)
for i in {1..110}; do
  curl http://localhost:5000/api/auth/login
done

# Expected: 429 Too Many Requests after ~100 requests
```

### Manual Testing Scenarios

#### Scenario 1: Trainee Workflow
1. Login as `trainee1@tms.com`
2. View assigned courses
3. Complete a task
4. Upload evidence file
5. Check dashboard for updated progress

#### Scenario 2: Trainer Workflow
1. Login as `trainer1@tms.com`
2. View assigned subjects
3. Grade trainee submissions
4. Provide feedback
5. Check trainee progress

#### Scenario 3: Admin Workflow
1. Login as `admin@tms.com`
2. Create new user (trainer/trainee)
3. Create new course
4. Assign trainers to subjects
5. Assign trainees to courses

---

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@tms.com",
  "password": "Admin@123"
}
```

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Courses

#### Get All Courses
```http
GET /api/courses
Authorization: Bearer <token>
```

#### Create Course (Admin/Supervisor)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Full Stack Development",
  "description": "Learn MERN stack",
  "duration": 90
}
```

### Tasks

#### Upload Task Evidence
```http
POST /api/tasks/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

#### Complete Task
```http
POST /api/tasks/:id/complete
Authorization: Bearer <token>
```

---

## 🔐 Security Features

- ✅ **JWT Authentication**: Access + Refresh tokens
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **CSRF Protection**: Token-based validation
- ✅ **Rate Limiting**: Express-rate-limit with Redis
- ✅ **Helmet**: Security headers
- ✅ **CORS**: Whitelist frontend domain
- ✅ **Input Validation**: Zod schemas
- ✅ **SQL Injection Prevention**: Prisma ORM

---

## 📊 Database Schema

### Core Tables
- **User**: Authentication and profile
- **Role**: ADMIN, SUPERVISOR, TRAINER, TRAINEE
- **Course**: Training programs
- **Subject**: Course modules
- **Task**: Assignments
- **TraineeTask**: Task submissions and grades
- **TaskFile**: Uploaded evidence files
- **PullRequest**: GitHub PR tracking
- **Notification**: Real-time alerts

### Relationships
```
User ──< UserRole >── Role
Course ──< Subject ──< Task
Trainee ──< TraineeTask >── Task
TraineeTask ──< TaskFile
```

---

## 🎨 UI/UX Features

- **Modern Design**: Glassmorphism, gradients, animations
- **Dark Mode Ready**: Tailwind dark mode classes
- **Responsive**: Mobile-first design
- **Accessibility**: ARIA labels, keyboard navigation
- **Loading States**: Skeletons and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
- Lint code (ESLint)
- Type check (TypeScript)
- Run tests (Jest)
- Build Docker image
- Deploy to Railway (auto)
- Deploy to Vercel (auto)
```

---

## 📝 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Security
COOKIE_SECRET=your-cookie-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Developer**: Vu Tran Tuan Minh
- **Supervisor**: [Your Supervisor Name]
- **Institution**: [Your Institution]

---

## 🙏 Acknowledgments

- React Team for amazing framework
- Vercel for seamless deployment
- Railway for reliable backend hosting
- Prisma for excellent ORM
- Tailwind CSS for beautiful styling

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Create Issue](https://github.com/vutrantuanminh/Intern-Training-Management-System-Spec/issues)
- Email: [your-email@example.com]

---

**Built with ❤️ using React, TypeScript, Express, and PostgreSQL**
