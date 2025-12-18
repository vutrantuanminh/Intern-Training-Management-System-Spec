import { useState, useEffect } from 'react';
import { Plus, ExternalLink, GitPullRequest, Loader2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface TraineePullRequestsProps {
  traineeId: string;
}

interface PullRequest {
  id: number;
  title: string;
  description: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  reviewedAt?: string;
  createdAt: string;
  task?: { id: number; title: string };
}

interface Task {
  id: number;
  title: string;
  subject?: { id: number; title: string };
}

export function TraineePullRequests({ traineeId }: TraineePullRequestsProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPullRequests();
    loadTasks();
  }, []);

  const loadPullRequests = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/pull-requests?limit=50');
      setPullRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response: any = await api.get('/trainee/progress');
      const allTasks: Task[] = [];
      (response.data || []).forEach((course: any) => {
        (course.subjects || []).forEach((subject: any) => {
          (subject.tasks || []).forEach((task: any) => {
            if (task.status !== 'COMPLETED') {
              allTasks.push({
                id: task.id,
                title: task.title,
                subject: { id: subject.id, title: subject.title },
              });
            }
          });
        });
      });
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">My Pull Requests</h3>
          <p className="text-gray-600 mt-1">Track your code submissions and reviews</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Submit PR
        </button>
      </div>

      <div className="space-y-4">
        {pullRequests.length > 0 ? (
          pullRequests.map((pr) => (
            <div key={pr.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <GitPullRequest className="w-6 h-6 text-purple-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">{pr.title}</h5>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {pr.task && <span>{pr.task.title}</span>}
                          <span>•</span>
                          <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(pr.status)}`}>
                        {pr.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">{pr.description}</p>

                    {pr.feedback && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="font-medium text-gray-700 mb-1">Trainer Feedback:</div>
                        <p className="text-gray-600">{pr.feedback}</p>
                        {pr.reviewedAt && (
                          <div className="text-gray-500 text-sm mt-2">
                            Reviewed on {new Date(pr.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}

                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <GitPullRequest className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No pull requests submitted yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:underline mt-2"
            >
              Submit your first PR
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePRModal
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          onPRCreated={(pr) => {
            setPullRequests([pr, ...pullRequests]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreatePRModal({ tasks, onClose, onPRCreated }: {
  tasks: Task[];
  onClose: () => void;
  onPRCreated: (pr: PullRequest) => void;
}) {
  const [formData, setFormData] = useState({
    taskId: '',
    title: '',
    description: '',
    url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        repoUrl: formData.url,
      };
      if (formData.taskId) {
        payload.taskId = parseInt(formData.taskId);
      }
      const response: any = await api.post('/pull-requests', payload);
      onPRCreated(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit pull request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold">Submit Pull Request</h4>
          <p className="text-gray-600 mt-1">Submit your code for review</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Related Task *</label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select a task...</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.subject?.title ? `${task.subject.title} - ` : ''}{task.title}
                </option>
              ))}
            </select>
            {tasks.length === 0 && (
              <p className="text-gray-500 text-sm mt-1">No incomplete tasks available</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">PR Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of your changes"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={5}
              placeholder="Describe what you implemented and any challenges you faced..."
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">GitHub PR URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://github.com/username/repo/pull/123"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Pull Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
