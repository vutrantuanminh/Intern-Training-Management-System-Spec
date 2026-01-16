
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';
import { GitPullRequest, ExternalLink, Check, X, MessageSquare, Loader2 } from 'lucide-react';

interface PullRequestManagementProps {
  trainerId: string;
}

// PR service functions
const prService = {
  getPullRequests: async (trainerId: string, params?: { status?: string }) => {
    // Use new GitHub PR endpoint
    return api.get(`/github-prs/trainer/${trainerId}`);
  },
  approvePR: async (prId: number, feedback: string) => {
    return api.put(`/pull-requests/${prId}/approve`, { feedback });
  },
  rejectPR: async (prId: number, feedback: string) => {
    return api.put(`/pull-requests/${prId}/reject`, { feedback });
  },
};

export function PullRequestManagement({ trainerId }: PullRequestManagementProps) {
  const { t } = useTranslation();
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadPullRequests();
  }, [filterStatus]);

  const loadPullRequests = async () => {
    try {
      setLoading(true);
      const response: any = await prService.getPullRequests(trainerId);
      let prs = response.data || response || [];
      
      // Filter by status if needed
      if (filterStatus !== 'all') {
        prs = prs.filter((pr: any) => pr.status.toLowerCase() === filterStatus.toLowerCase());
      }
      
      setPullRequests(prs);
    } catch (error) {
      console.error('Failed to load pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPR) return;
    try {
      setSubmitting(true);
      await prService.approvePR(selectedPR.id, feedback);
      setSelectedPR(null);
      setFeedback('');
      loadPullRequests();
    } catch (error) {
      console.error('Failed to approve PR:', error);
      alert(t('pullRequestManagement.failedToApprovePR', 'Failed to approve PR'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPR) return;
    if (!feedback.trim()) {
      alert(t('pullRequestManagement.provideFeedbackForRejection', 'Please provide feedback for rejection'));
      return;
    }
    try {
      setSubmitting(true);
      await prService.rejectPR(selectedPR.id, feedback);
      setSelectedPR(null);
      setFeedback('');
      loadPullRequests();
    } catch (error) {
      console.error('Failed to reject PR:', error);
      alert(t('pullRequestManagement.failedToRejectPR', 'Failed to reject PR'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { class: 'bg-yellow-100 text-yellow-700', label: t('pullRequestManagement.status.pending', 'Pending') };
      case 'APPROVED': return { class: 'bg-green-100 text-green-700', label: t('pullRequestManagement.status.approved', 'Approved') };
      case 'REJECTED': return { class: 'bg-red-100 text-red-700', label: t('pullRequestManagement.status.rejected', 'Rejected') };
      default: return { class: 'bg-gray-100 text-gray-700', label: t(`pullRequestManagement.status.${status.toLowerCase()}`, status) };
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
          <h3 className="text-2xl font-bold text-gray-900">{t('pullRequestManagement.title', 'Pull Requests')}</h3>
          <p className="text-gray-600 mt-1">{t('pullRequestManagement.subtitle', 'Review and evaluate trainee submissions')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{t('pullRequestManagement.filterByStatus', 'Filter by status:')}</span>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {t(`pullRequestManagement.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pull Requests List */}
      <div className="space-y-4">
        {pullRequests.length > 0 ? (
          pullRequests.map((pr) => {
            const status = getStatusBadge(pr.status);
            return (
              <div key={pr.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                            <span className="font-medium">{pr.trainee?.fullName || t('pullRequestManagement.unknown', 'Unknown')}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-indigo-600 font-medium">{pr.course?.title || t('pullRequestManagement.noCourse', 'No course')}</span>
                            <span className="text-gray-400">•</span>
                            <span>{t('pullRequestManagement.traineeId', 'ID')}: {pr.traineeId}</span>
                            <span className="text-gray-400">•</span>
                            <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                          </div>
                          {pr.prNumber && pr.repoName && (
                            <div className="text-xs text-gray-500 mt-1">
                              {pr.repoName} #{pr.prNumber}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{pr.description || t('pullRequestManagement.noDescription', 'No description')}</p>

                      <div className="flex items-center gap-3">
                        {pr.prUrl && (
                          <a
                            href={pr.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t('pullRequestManagement.viewOnGitHub', 'View on GitHub')}
                          </a>
                        )}

                        {pr.status === 'PENDING' && pr.prUrl && (
                          <a
                            href={pr.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {t('pullRequestManagement.review', 'Review')}
                          </a>
                        )}
                      </div>

                      {pr.feedback && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-gray-700 font-medium mb-1">{t('pullRequestManagement.feedback', 'Feedback')}:</div>
                          <p className="text-gray-600">{pr.feedback}</p>
                          {pr.reviewedAt && (
                            <div className="text-gray-500 text-sm mt-2">
                              {t('pullRequestManagement.reviewedOn', 'Reviewed on')} {new Date(pr.reviewedAt).toLocaleString()}
                              {pr.reviewer && ` ${t('pullRequestManagement.by', 'by')} ${pr.reviewer.fullName}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <GitPullRequest className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">{t('pullRequestManagement.noPullRequests', 'No pull requests found')}</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPR && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold">{t('pullRequestManagement.reviewTitle', 'Review Pull Request')}</h4>
              <p className="text-gray-600 mt-1">{selectedPR.title}</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">{t('pullRequestManagement.feedback', 'Feedback')}</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={6}
                  placeholder={t('pullRequestManagement.feedbackPlaceholder', 'Provide feedback to the trainee...')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('pullRequestManagement.approve', 'Approve')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  {t('pullRequestManagement.reject', 'Reject')}
                </button>
                <button
                  onClick={() => {
                    setSelectedPR(null);
                    setFeedback('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('pullRequestManagement.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
