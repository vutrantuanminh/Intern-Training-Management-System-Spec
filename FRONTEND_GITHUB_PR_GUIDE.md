# Frontend Implementation Guide - GitHub PR Management

## Components Updated

### 1. PullRequestManagement.tsx (Trainer View)
**Location:** `src/components/trainer/PullRequestManagement.tsx`

**Changes Made:**
- Updated API endpoint từ `/pull-requests` → `/github-prs/trainer/:trainerId`
- Hiển thị tên khóa học: `pr.course?.title`
- Hiển thị trainee ID: `pr.traineeId`
- Hiển thị repo và PR number: `pr.repoName #pr.prNumber`
- Link "View on GitHub" sử dụng `pr.prUrl` (link đến PR trên GitHub)
- Style button "View on GitHub" với màu đen GitHub

## Components Cần Tạo Thêm

### 2. TraineePullRequestView.tsx (Trainee View)
**Location:** `src/components/trainee/TraineePullRequestView.tsx`

```typescript
import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { GitPullRequest, ExternalLink, Plus, Github } from 'lucide-react';

export function TraineePullRequestView({ traineeId }: { traineeId: string }) {
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [githubStatus, setGithubStatus] = useState({ connected: false, githubUsername: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [traineeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prsResponse, statusResponse] = await Promise.all([
        api.get(\`/github-prs/trainee/\${traineeId}\`),
        api.get('/auth/github/status')
      ]);
      setPullRequests(prsResponse.data || prsResponse || []);
      setGithubStatus(statusResponse.data || statusResponse);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = () => {
    window.location.href = '/api/auth/github';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">My Pull Requests</h3>
          <p className="text-gray-600 mt-1">Track your code submissions and reviews</p>
        </div>
        {!githubStatus.connected && (
          <button
            onClick={connectGitHub}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Github className="w-5 h-5" />
            Connect GitHub
          </button>
        )}
        {githubStatus.connected && (
          <div className="text-sm text-gray-600">
            Connected: <span className="font-medium">{githubStatus.githubUsername}</span>
          </div>
        )}
      </div>

      {githubStatus.connected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to Submit a PR:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Create a branch with format: <code className="bg-blue-100 px-1 rounded">trainee-{traineeId}-feature-name</code></li>
            <li>Push your code and create a Pull Request on GitHub</li>
            <li>Comment "ready" on your PR when it's ready for review</li>
            <li>Your PR will automatically appear here and notify your trainers</li>
          </ol>
        </div>
      )}

      {/* Pull Requests List */}
      <div className="space-y-4">
        {pullRequests.length > 0 ? (
          pullRequests.map((pr) => (
            <div key={pr.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{pr.title}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium text-indigo-600">{pr.course?.title}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                  </div>
                  {pr.prNumber && pr.repoName && (
                    <div className="text-xs text-gray-500 mt-1">
                      {pr.repoName} #{pr.prNumber}
                    </div>
                  )}
                </div>
                <span className={\`px-3 py-1 rounded text-sm font-medium \${
                  pr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  pr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }\`}>
                  {pr.status}
                </span>
              </div>

              {pr.description && (
                <p className="text-gray-600 mb-3">{pr.description}</p>
              )}

              {pr.prUrl && (
                <a
                  href={pr.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on GitHub
                </a>
              )}

              {pr.reviewer && pr.reviewedAt && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium text-gray-700">
                    Reviewed by {pr.reviewer.fullName} on {new Date(pr.reviewedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <GitPullRequest className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No pull requests yet</p>
            {githubStatus.connected && (
              <p className="text-sm text-gray-400 mt-1">
                Create your first PR following the instructions above
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. GitHubSettings.tsx (Settings Page)
**Location:** `src/components/settings/GitHubSettings.tsx`

```typescript
import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Github, Check, X } from 'lucide-react';

export function GitHubSettings() {
  const [status, setStatus] = useState({ connected: false, githubUsername: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    
    // Check for connection success/error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      loadStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadStatus = async () => {
    try {
      const response = await api.get('/auth/github/status');
      setStatus(response.data || response);
    } catch (error) {
      console.error('Failed to load GitHub status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = () => {
    window.location.href = '/api/auth/github';
  };

  const disconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return;
    
    try {
      await api.post('/auth/github/disconnect');
      setStatus({ connected: false, githubUsername: null });
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      alert('Failed to disconnect GitHub account');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Github className="w-6 h-6" />
        <h3 className="text-lg font-semibold">GitHub Integration</h3>
      </div>

      {status.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">Connected</div>
              <div className="text-sm text-green-700">@{status.githubUsername}</div>
            </div>
          </div>

          <button
            onClick={disconnectGitHub}
            className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
          >
            Disconnect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-3">
              Connect your GitHub account to submit pull requests and receive automated feedback.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Submit code directly from GitHub</li>
              <li>Automatic PR tracking</li>
              <li>Real-time notifications from trainers</li>
            </ul>
          </div>

          <button
            onClick={connectGitHub}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Github className="w-5 h-5" />
            Connect GitHub Account
          </button>
        </div>
      )}
    </div>
  );
}
```

## Integration Steps

### 1. Add to Trainee Dashboard
In `src/components/TraineeDashboard.tsx`:

```typescript
import { TraineePullRequestView } from './trainee/TraineePullRequestView';
import { GitPullRequest } from 'lucide-react';

// Add to tabs
const tabs = [
  // ...existing tabs
  { id: 'pull-requests', label: 'Pull Requests', icon: <GitPullRequest /> },
];

// Add to view rendering
{currentView === 'pull-requests' && <TraineePullRequestView traineeId={user.id} />}
```

### 2. Add to Settings Page
In settings or profile page:

```typescript
import { GitHubSettings } from './settings/GitHubSettings';

// Add in settings sections
<GitHubSettings />
```

## API Endpoints Used

### Trainer Endpoints:
- `GET /api/github-prs/trainer/:trainerId` - Get all PRs for trainer's courses
- `GET /api/github-prs/course/:courseId` - Get PRs for specific course
- `GET /api/github-prs/:id` - Get PR details

### Trainee Endpoints:
- `GET /api/github-prs/trainee/:traineeId` - Get trainee's PRs
- `GET /api/auth/github/status` - Check GitHub connection
- `GET /api/auth/github` - Connect GitHub (redirects to GitHub OAuth)
- `POST /api/auth/github/disconnect` - Disconnect GitHub

### Admin Endpoints:
- `POST /api/course-repos` - Link repo to course
- `GET /api/course-repos/:courseId` - Get course repos
- `DELETE /api/course-repos` - Unlink repo

## Data Structure

```typescript
interface PullRequest {
  id: number;
  traineeId: number;
  courseId: number;
  title: string;
  description: string;
  prUrl: string;           // GitHub PR URL
  prNumber: number;        // GitHub PR number
  repoName: string;        // e.g., "training-org/project"
  githubUserId: string;    // GitHub user ID
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerId?: number;
  reviewedAt?: string;
  createdAt: string;
  trainee: {
    id: number;
    fullName: string;
    email: string;
  };
  course: {
    id: number;
    title: string;
  };
  reviewer?: {
    id: number;
    fullName: string;
  };
}
```

## Environment Variables Required

Add to `.env`:
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

## Next Steps

1. Create `TraineePullRequestView.tsx` component
2. Create `GitHubSettings.tsx` component
3. Integrate into Trainee Dashboard
4. Test GitHub OAuth flow
5. Test PR submission flow
6. Set up GitHub App webhook
