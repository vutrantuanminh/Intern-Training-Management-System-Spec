# GitHub App Setup Guide

## Tổng Quan
Hệ thống sử dụng GitHub App để quản lý Pull Requests thông qua webhook và OAuth. Flow hoạt động:

1. **Trainee** connect GitHub account qua OAuth
2. **Trainee** tạo PR trên GitHub với branch format: `trainee-{id}-feature-name`
3. **Trainee** comment "ready" trên PR
4. **Webhook** tự động capture event và tạo record trong database
5. **Trainer** nhận notification và review PR
6. **Trainer** merge/approve/comment → **Trainee** nhận notification

## Bước 1: Tạo GitHub App

### 1.1. Truy cập GitHub Settings
- Vào https://github.com/settings/apps
- Click **New GitHub App**

### 1.2. Cấu hình App
**Basic Information:**
- **GitHub App name:** `Intern-Training-System` (hoặc tên bạn chọn)
- **Homepage URL:** `http://localhost:5173` (dev) hoặc domain production
- **Webhook URL:** `https://yourdomain.com/api/github/webhook`
  - Development: Sử dụng ngrok hoặc expose port 5000
  - Production: URL thật của backend
- **Webhook secret:** Tạo random string (dùng cho GITHUB_WEBHOOK_SECRET)

**Permissions:**
Repository permissions:
- **Pull requests:** Read & Write
- **Issues:** Read & Write
- **Contents:** Read only
- **Metadata:** Read only

**Subscribe to events:**
- ✅ Pull request
- ✅ Issue comment
- ✅ Pull request review
- ✅ Pull request review comment

**Where can this GitHub App be installed?**
- Chọn: **Any account** (nếu muốn public) hoặc **Only on this account**

### 1.3. Lưu thông tin
Sau khi tạo, lưu lại:
- **Client ID** → `GITHUB_CLIENT_ID`
- **Client Secret** (Generate nếu chưa có) → `GITHUB_CLIENT_SECRET`
- **Webhook Secret** (đã tạo ở bước 1.2) → `GITHUB_WEBHOOK_SECRET`

## Bước 2: Install GitHub App

### 2.1. Install vào Organization/Account
- Vào tab **Install App** trong GitHub App settings
- Chọn organization hoặc personal account
- Chọn repositories:
  - **All repositories** (khuyến nghị cho training)
  - Hoặc chọn specific repos

### 2.2. Grant Permissions
- Xác nhận permissions đã cấu hình
- Click **Install**

## Bước 3: Cấu hình Backend

### 3.1. Environment Variables
Thêm vào `backend/.env`:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=Iv23li5yfpVwyAjbACqa
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# GitHub Webhook
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

**Production:**
```env
GITHUB_CALLBACK_URL=https://api.yourdomain.com/api/auth/github/callback
```

### 3.2. Kiểm tra Routes đã đăng ký
File `backend/src/index.ts` đã có:
```typescript
app.use('/api/auth', githubAuthRoutes);
app.use('/api', pullRequestRoutes); // includes /github/webhook
```

### 3.3. Khởi động Backend
```bash
cd backend
npm run dev
```

Backend sẽ lắng nghe webhook tại: `http://localhost:5000/api/github/webhook`

## Bước 4: Expose Webhook (Development)

### Option 1: Ngrok (Khuyến nghị)
```bash
# Install ngrok
npm install -g ngrok

# Expose port 5000
ngrok http 5000
```

Copy URL forwarding (VD: `https://abc123.ngrok.io`) và update:
- GitHub App → Webhook URL: `https://abc123.ngrok.io/api/github/webhook`

### Option 2: LocalTunnel
```bash
npm install -g localtunnel
lt --port 5000 --subdomain your-subdomain
```

### Option 3: Production Deploy
Deploy backend lên server với domain thật, không cần ngrok.

## Bước 5: Link Repo to Course (Admin/Supervisor)

### 5.1. Via API
```bash
POST /api/course-repos
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "courseId": 1,
  "repoName": "training-org/project-repo",
  "repoUrl": "https://github.com/training-org/project-repo"
}
```

### 5.2. Via UI (Tạo component sau)
Trong Admin/Supervisor dashboard, thêm form link repo:
- Select Course
- Input Repo Name (format: `owner/repo`)
- Input Repo URL
- Save

## Bước 6: Test Flow

### 6.1. Trainee Connect GitHub
1. Login as trainee
2. Vào **Settings** tab
3. Click **Connect GitHub**
4. Authorize trên GitHub
5. Redirect về `/trainee?github_connected=true`

### 6.2. Trainee Tạo PR
1. Clone repo đã được link vào course
2. Tạo branch: `trainee-1-add-feature` (1 = trainee ID)
3. Commit code
4. Push và tạo PR trên GitHub
5. Comment "ready" trên PR

### 6.3. Kiểm tra Webhook
Backend log sẽ hiển thị:
```
GitHub webhook received: issue_comment
Found trainee ID: 1
PR added to database: { id: 123, traineeId: 1, prNumber: 5, ... }
Notification sent to trainers
```

### 6.4. Trainer Review
1. Login as trainer
2. Vào **Pull Requests** tab
3. Thấy PR mới từ trainee
4. Click **View on GitHub**
5. Review/approve/merge trên GitHub

### 6.5. Kiểm tra Notification
Trainee sẽ nhận notification khi:
- Trainer approve PR
- Trainer reject PR
- Trainer comment trên PR
- PR được merge

## Troubleshooting

### Webhook không hoạt động
**Kiểm tra:**
1. Webhook URL đúng format: `https://domain.com/api/github/webhook`
2. Webhook secret khớp với GITHUB_WEBHOOK_SECRET
3. Backend đang chạy và accessible từ internet
4. GitHub App đã install vào repo
5. Permissions đã được cấp đầy đủ

**Debug:**
```typescript
// Thêm vào backend/src/modules/pull-requests/githubAppWebhook.ts
console.log('Webhook headers:', req.headers);
console.log('Webhook body:', req.body);
```

Vào GitHub App → Settings → Recent Deliveries để xem webhook response.

### OAuth không redirect
**Kiểm tra:**
1. GITHUB_CALLBACK_URL đúng với URL trong GitHub App
2. Frontend call đúng endpoint: `window.location.href = '/api/auth/github'`
3. CORS đã enable cho domain frontend

**Fix CORS (nếu cần):**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true
}));
```

### Trainee ID không được detect
**Format branch name:**
- ✅ `trainee-1-feature-name`
- ✅ `trainee-123-bug-fix`
- ❌ `1-trainee-feature` (sai format)

**Hoặc thêm vào PR body:**
```
trainee_id:1
```

### PR không hiện trong UI
**Kiểm tra:**
1. CourseRepo đã được tạo cho course
2. API endpoint đúng: `/api/github-prs/trainee/:traineeId`
3. JWT token valid trong localStorage
4. Network tab trong DevTools xem response

## Security Best Practices

### 1. Webhook Signature Verification
✅ Đã implement trong `githubAppWebhook.ts`:
```typescript
verifyGitHubSignature(req.body, signature, GITHUB_WEBHOOK_SECRET)
```

### 2. OAuth State Parameter (Recommended)
Thêm CSRF protection:
```typescript
// Generate state
const state = crypto.randomBytes(16).toString('hex');
req.session.githubState = state;

// Redirect với state
redirect(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&state=${state}`);

// Verify trong callback
if (req.query.state !== req.session.githubState) {
  throw new Error('Invalid state');
}
```

### 3. Rate Limiting
```typescript
// backend/src/middleware/rateLimit.ts
export const githubWebhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute
  message: 'Too many webhook requests'
});

// Apply vào route
router.post('/github/webhook', githubWebhookRateLimit, handleGitHubWebhook);
```

## Monitoring

### 1. Webhook Deliveries
- GitHub App → Settings → Recent Deliveries
- Xem status code, headers, response time

### 2. Database Logs
```sql
-- Check recent PRs
SELECT * FROM "PullRequest" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check GitHub connections
SELECT id, email, "githubUsername" 
FROM "User" 
WHERE "githubId" IS NOT NULL;

-- Check course repos
SELECT * FROM "CourseRepo";
```

### 3. Application Logs
```bash
# Backend logs
npm run dev | tee logs/backend.log

# Search for webhook events
grep "GitHub webhook" logs/backend.log
```

## Production Checklist

- [ ] GitHub App cấu hình với production webhook URL
- [ ] HTTPS enabled cho webhook endpoint
- [ ] Webhook secret strong và secure
- [ ] Environment variables set trên production server
- [ ] Database migrations applied
- [ ] CORS cấu hình đúng origin
- [ ] Rate limiting enabled
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Monitoring dashboard
- [ ] Backup strategy cho webhook events
- [ ] Documentation cho users

## Support

Nếu gặp vấn đề:
1. Check logs: `backend/logs/` và GitHub webhook deliveries
2. Verify environment variables
3. Test webhook với curl:
```bash
curl -X POST http://localhost:5000/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"action":"opened","pull_request":{"number":1}}'
```
