# GitHub App Pull Request Management - Hướng dẫn sử dụng

## Tổng quan

Hệ thống Pull Request Management mới sử dụng GitHub App và Webhook để quản lý PR tự động, thông báo cho trainers và trainees.

## Luồng hoạt động

### 1. Cấu hình GitHub App (Admin)

1. Tạo GitHub App tại: https://github.com/settings/apps/new
2. Cấu hình webhook URL: `https://your-domain.com/api/github/webhook`
3. Cấu hình webhook secret: sử dụng giá trị trong `GITHUB_WEBHOOK_SECRET` (.env)
4. Cấp quyền:
   - Pull requests: Read & Write
   - Issues: Read & Write (để nhận comment events)
   - Contents: Read
5. Subscribe to events:
   - Pull request
   - Pull request review
   - Issue comment
6. Cài đặt App vào các repos của khóa học

### 2. Liên kết Repo với Khóa học (Admin/Supervisor)

**Endpoint:** `POST /api/course-repos`

```json
{
  "courseId": 1,
  "repoName": "owner/repo-name",
  "repoUrl": "https://github.com/owner/repo-name"
}
```

**Lấy danh sách repos của khóa học:**
```
GET /api/course-repos/:courseId
```

**Xóa liên kết:**
```
DELETE /api/course-repos
Body: { "courseId": 1, "repoName": "owner/repo-name" }
```

### 3. Trainee gửi Pull Request

#### Bước 1: Tạo branch với trainee ID
Trainee tạo branch theo format: `trainee-{id}-feature-name`

Ví dụ: `trainee-123-login-feature`

#### Bước 2: Tạo PR trên GitHub
- Tạo PR từ branch của trainee về main/master
- Trong PR body, có thể thêm: `trainee_id:123` để xác định trainee

#### Bước 3: Comment "ready" khi hoàn thành
Khi trainee đã hoàn thành và sẵn sàng cho review:
- Comment "ready" (hoặc "Ready", "READY") trên PR
- Webhook sẽ tự động:
  - Lưu PR vào database
  - Gửi thông báo cho tất cả trainers của khóa học

### 4. Trainer nhận thông báo và review

**Xem danh sách PR của tất cả khóa học mình phụ trách:**
```
GET /api/github-prs/trainer/:trainerId
```

**Xem danh sách PR của một khóa học cụ thể:**
```
GET /api/github-prs/course/:courseId
```

**Xem chi tiết một PR:**
```
GET /api/github-prs/:id
```

**Response example:**
```json
{
  "id": 1,
  "traineeId": 123,
  "courseId": 1,
  "title": "Add login feature",
  "prUrl": "https://github.com/owner/repo/pull/45",
  "prNumber": 45,
  "repoName": "owner/repo",
  "status": "PENDING",
  "trainee": {
    "id": 123,
    "fullName": "Nguyễn Văn A",
    "email": "trainee@example.com"
  },
  "course": {
    "id": 1,
    "title": "Web Development Course"
  },
  "createdAt": "2026-01-14T10:00:00Z"
}
```

### 5. Trainer review/merge trên GitHub

Khi trainer:
- Review PR → Trainee nhận thông báo
- Approve PR → PR status = "APPROVED", trainee nhận thông báo
- Request changes → Trainee nhận thông báo
- Merge PR → PR status = "APPROVED", trainee nhận thông báo
- Close PR (không merge) → PR status = "REJECTED", trainee nhận thông báo

### 6. Trainee xem PR của mình

```
GET /api/github-prs/trainee/:traineeId
```

## Thông báo

### Trainers nhận thông báo khi:
- Trainee comment "ready" trên PR mới
- Trainee có update trên PR

### Trainees nhận thông báo khi:
- Trainer review PR (approved, changes requested, commented)
- Trainer merge PR
- Trainer close/reject PR

## Cấu trúc Database

### CourseRepo
- Lưu mapping giữa course và GitHub repo
- Một course có thể có nhiều repos
- Một repo chỉ thuộc một course

### PullRequest
- `prUrl`: Link đến PR trên GitHub
- `prNumber`: Số PR trên GitHub
- `repoName`: Tên repo (format: owner/repo)
- `githubUserId`: GitHub user ID của trainee
- `status`: PENDING, APPROVED, REJECTED

### User
- `githubId`: GitHub user ID
- `githubUsername`: GitHub username

## Format PR để hệ thống nhận diện trainee

### Cách 1: Branch name
```
trainee-{id}-{feature-name}
Ví dụ: trainee-123-login-feature
```

### Cách 2: PR body
```markdown
# Feature Description
...

trainee_id:123
```

## Webhook Events được xử lý

1. **pull_request** (action: opened, closed)
   - opened: Chưa tạo record, chờ comment "ready"
   - closed: Cập nhật status (merged = APPROVED, closed = REJECTED)

2. **issue_comment** (action: created)
   - Kiểm tra comment có chứa "ready"
   - Tạo PR record trong database
   - Gửi thông báo cho trainers

3. **pull_request_review** (action: submitted)
   - Cập nhật status nếu approved
   - Gửi thông báo cho trainee

## Lưu ý

1. **Bảo mật**: Webhook signature được verify bằng `GITHUB_WEBHOOK_SECRET`
2. **Trainee ID**: Hệ thống trích xuất từ branch name hoặc PR body
3. **Course mapping**: Repo phải được link với course trước khi trainee gửi PR
4. **Thông báo**: Tất cả thông báo được lưu trong bảng Notification

## Testing

### Test webhook locally với ngrok:
```bash
ngrok http 5000
# Sử dụng URL ngrok làm webhook URL trong GitHub App
```

### Test flow:
1. Link repo với course
2. Trainee tạo branch: `trainee-1-test-feature`
3. Tạo PR trên GitHub
4. Comment "ready"
5. Kiểm tra database: PR được tạo
6. Kiểm tra notifications: Trainers nhận thông báo
7. Trainer review/merge trên GitHub
8. Kiểm tra: Trainee nhận thông báo

## API Endpoints Summary

```
# Course Repo Management
POST   /api/course-repos              - Link repo to course
GET    /api/course-repos/:courseId    - Get repos of course
DELETE /api/course-repos               - Unlink repo

# GitHub PR Management
GET /api/github-prs/course/:courseId   - Get PRs by course
GET /api/github-prs/trainee/:traineeId - Get PRs by trainee
GET /api/github-prs/trainer/:trainerId - Get PRs by trainer (all courses)
GET /api/github-prs/:id                - Get PR details

# Webhook
POST /api/github/webhook               - GitHub App webhook endpoint
```
