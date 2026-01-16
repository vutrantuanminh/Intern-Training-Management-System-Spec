import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';
import { config } from '../../config/api';
import { GitPullRequest, ExternalLink, Github, Plus, Trash2 } from 'lucide-react';

export function TraineePullRequestView({ traineeId }: { traineeId: string }) {
  const { t } = useTranslation();
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [githubStatus, setGithubStatus] = useState({ connected: false, githubUsername: null });
  const [myRepos, setMyRepos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRepo, setNewRepo] = useState({
    courseId: '',
    repoName: '',
    repoUrl: '',
  });

  useEffect(() => {
    loadData();
  }, [traineeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prsResponse, statusResponse, reposResponse, coursesResponse] = await Promise.all([
        api.get(`/github-prs/trainee/${traineeId}`),
        api.get('/auth/github/status'),
        api.get(`/trainee-repos/${traineeId}`),
        api.get('/trainee/progress'), // Get trainee's courses
      ]);
      // Type guards for API responses
      const getData = (resp: any) => (resp && typeof resp === 'object' && 'data' in resp ? (resp as any).data : resp);

      setPullRequests(getData(prsResponse) || []);
      setGithubStatus(getData(statusResponse) || {});
      setMyRepos(getData(reposResponse) || []);

      // Extract courses from progress response
      const coursesData = getData(coursesResponse) || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = () => {
    // Use full backend URL for OAuth redirect with JWT token
    const backendUrl = config.apiUrl.replace('/api', '');
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      alert(t('traineePullRequestView.pleaseLogin'));
      return;
    }
    
    const githubUrl = `${backendUrl}/api/auth/github?token=${encodeURIComponent(token)}`;
    console.log('Connecting to GitHub:', githubUrl);
    window.location.href = githubUrl;
  };

  const handleAddRepo = async () => {
    if (!newRepo.courseId || !newRepo.repoName) {
      alert(t('traineePullRequestView.selectCourseAndName'));
      return;
    }

    if (!newRepo.repoName.includes('/')) {
      alert(t('traineePullRequestView.repoNameFormat'));
      return;
    }

    try {
      await api.post('/trainee-repos', {
        traineeId: Number(traineeId),
        courseId: Number(newRepo.courseId),
        repoName: newRepo.repoName,
        repoUrl: newRepo.repoUrl || `https://github.com/${newRepo.repoName}`,
      });

      setShowRepoModal(false);
      setNewRepo({ courseId: '', repoName: '', repoUrl: '' });
      loadData();
    } catch (error) {
      console.error('Failed to add repo:', error);
      alert(t('traineePullRequestView.failedLinkRepo'));
    }
  };

  const handleDeleteRepo = async (repoId: number) => {
    if (!confirm(t('traineePullRequestView.unlinkConfirm'))) return;

    try {
      // Truyền traineeId qua query string để backend nhận được với DELETE
      const url = `${config.apiUrl}/trainee-repos/${repoId}?traineeId=${traineeId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });
      loadData();
    } catch (error) {
      console.error('Failed to delete repo:', error);
      alert(t('traineePullRequestView.failedUnlinkRepo'));
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('traineePullRequestView.loading', 'Loading...')}</div>;
  }

  // Defensive: avoid crash if githubStatus is undefined
  const isGithubConnected = githubStatus && githubStatus.connected;
  const githubUsername = githubStatus && githubStatus.githubUsername;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{t('traineePullRequestView.title', 'My Pull Requests')}</h3>
          <p className="text-gray-600 mt-1">{t('traineePullRequestView.subtitle', 'Track your code submissions and reviews')}</p>
        </div>
        <div className="flex items-center gap-3">
          {isGithubConnected && (
            <button
              onClick={() => setShowRepoModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              {t('traineePullRequestView.linkMyRepo', 'Link My Repo')}
            </button>
          )}
          {!isGithubConnected && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked!');
                connectGitHub();
              }}
              type="button"
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 9999 }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer"
          >
            <Github className="w-5 h-5" />
            {t('traineePullRequestView.connectGithub', 'Connect GitHub')}
          </button>
          )}
          {isGithubConnected && (
            <div className="text-sm text-gray-600">
              {t('traineePullRequestView.connected', 'Connected')}: <span className="font-medium">{githubUsername}</span>
            </div>
          )}
        </div>
      </div>

      {githubStatus.connected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">{t('traineePullRequestView.howToSubmit', 'How to Submit a PR:')}</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>{t('traineePullRequestView.step1', 'Link your repo below (or use course repos)')}</li>
            <li>{t('traineePullRequestView.step2', 'Create a branch with format:')} <code className="bg-blue-100 px-1 rounded">trainee-{traineeId}-feature-name</code></li>
            <li>{t('traineePullRequestView.step3', 'Push your code and create a Pull Request on GitHub')}</li>
            <li>{t('traineePullRequestView.step4', 'Comment "ready" on your PR when it\'s ready for review')}</li>
            <li>{t('traineePullRequestView.step5', 'Your PR will automatically appear here and notify your trainers')}</li>
          </ol>
        </div>
      )}

      {/* My Linked Repos */}
      {githubStatus.connected && myRepos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">{t('traineePullRequestView.myLinkedRepos', 'My Linked Repositories')}</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {myRepos.map((repo: any) => (
              <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{repo.repoName}</div>
                    <div className="text-sm text-gray-500">
                      {t('traineePullRequestView.course', 'Course')}: {repo.course?.title}
                    </div>
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {t('traineePullRequestView.viewOnGithub', 'View on GitHub')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRepo(repo.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
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
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  pr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  pr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {t(`traineePullRequestView.status.${pr.status.toLowerCase()}`, { defaultValue: pr.status })}
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
                  {t('traineePullRequestView.viewOnGithub', 'View on GitHub')}
                </a>
              )}

              {pr.reviewer && pr.reviewedAt && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium text-gray-700">
                    {t('traineePullRequestView.reviewedBy', 'Reviewed by')} {pr.reviewer.fullName} {t('traineePullRequestView.on', 'on')} {new Date(pr.reviewedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <GitPullRequest className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">{t('traineePullRequestView.noPullRequests', 'No pull requests yet')}</p>
            {githubStatus.connected && (
              <p className="text-sm text-gray-400 mt-1">
                {t('traineePullRequestView.createFirstPr', 'Create your first PR following the instructions above')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Repository Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('traineePullRequestView.linkYourRepo', 'Link Your Repository')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('traineePullRequestView.selectCourse', 'Select Course *')}
                </label>
                <select
                  value={newRepo.courseId}
                  onChange={(e) => setNewRepo({ ...newRepo, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('traineePullRequestView.selectCoursePlaceholder', '-- Select a course --')}</option>
                  {courses.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('traineePullRequestView.repoName', 'Repository Name *')}
                </label>
                <input
                  type="text"
                  value={newRepo.repoName}
                  onChange={(e) => setNewRepo({ ...newRepo, repoName: e.target.value })}
                  placeholder={t('traineePullRequestView.repoNamePlaceholder', 'your-username/your-repo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('traineePullRequestView.repoNameFormat', 'Format: owner/repository-name (e.g., john/my-project)')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('traineePullRequestView.repoUrl', 'Repository URL (optional)')}
                </label>
                <input
                  type="text"
                  value={newRepo.repoUrl}
                  onChange={(e) => setNewRepo({ ...newRepo, repoUrl: e.target.value })}
                  placeholder={t('traineePullRequestView.repoUrlPlaceholder', 'https://github.com/your-username/your-repo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('traineePullRequestView.repoUrlHint', 'Leave empty to auto-generate from repo name')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddRepo}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('traineePullRequestView.linkRepository', 'Link Repository')}
              </button>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  setNewRepo({ courseId: '', repoName: '', repoUrl: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('traineePullRequestView.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
