import { useState, useEffect } from 'react';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { TraineeCourses } from './trainee/TraineeCourses';
import { DailyReports } from './trainee/DailyReports';
import TraineePullRequests from './trainee/TraineePullRequests';
import { TraineePullRequestView } from './trainee/TraineePullRequestView';
import { ChatInterface } from './shared/ChatInterface';
import { GitHubSettings } from './settings/GitHubSettings';
import { LayoutDashboard, BookOpen, FileText, GitPullRequest, MessageSquare, Loader2, Calendar, CheckCircle, Settings } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useTranslation } from 'react-i18next';

interface TraineeDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TraineeDashboard({ user, onLogout }: TraineeDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  const { t } = useTranslation();
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: t('myCourses'), icon: <BookOpen className="w-5 h-5" /> },
    { id: 'reports', label: t('dailyReports'), icon: <FileText className="w-5 h-5" /> },
    { id: 'pull-requests', label: t('pullRequests'), icon: <GitPullRequest className="w-5 h-5" /> },
    { id: 'chat', label: t('messages'), icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={onLogout}
      menuItems={menuItems}
    >
      {currentView === 'dashboard' && <TraineeOverview onViewChange={setCurrentView} />}
      {currentView === 'courses' && <TraineeCourses traineeId={user.id} />}
      {currentView === 'reports' && <DailyReports traineeId={user.id} />}
      {currentView === 'pull-requests' && <TraineePullRequestView traineeId={user.id} />}
      {currentView === 'chat' && <ChatInterface currentUserId={user.id} />}
      {currentView === 'settings' && <GitHubSettings />}
    </DashboardLayout>
  );
}

function TraineeOverview({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response: any = await api.get('/trainee/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">{t('failedToLoadDashboard')}</div>;
  }

  const stats = data.statistics || {};
  const courses = data.courses || [];
  const upcomingTasks = data.upcomingDeadlines || [];
  const recentReports = data.recentReports || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{t('myDashboard')}</h3>
        <p className="text-gray-600 mt-1">{t('trackYourLearningProgress')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{t('enrolledCourses')}</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCourses || 0}</div>
          <div className="text-blue-600 text-sm mt-1">{t('inProgress', { count: stats.activeCourses || 0 })}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{t('completedTasks')}</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.completedTasks || 0}/{stats.totalTasks || 0}
          </div>
          <div className="text-green-600 text-sm mt-1">
            {t('completionRate', { rate: stats.completionRate || 0 })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{t('pullRequests')}</span>
            <div className="p-2 bg-purple-100 rounded-lg">
              <GitPullRequest className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPRs || 0}</div>
          <div className="text-green-600 text-sm mt-1">{t('approvedPRs', { count: stats.approvedPRs || 0 })}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{t('dailyReports')}</span>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalReports || 0}</div>
          <div className="text-green-600 text-sm mt-1">{t('keepItUp')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> {t('courseProgress')}
          </h4>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.slice(0, 3).map((course: any) => (
                <div key={course.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{course.title}</span>
                    <span className="text-gray-600 text-sm">
                      {course.completedTasks || 0}/{course.totalTasks || 0} {t('tasks')}
                    </span>
                  </div>
                  <div className="trainee-progress-bar-bg">
                    <div className="trainee-progress-bar" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                  <div className="text-gray-600 text-sm">{t('percentComplete', { percent: Math.round(course.progress || 0) })}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">{t('noCoursesEnrolledYet')}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" /> {t('upcomingDeadlines')}
          </h4>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-gray-600 text-sm">{task.course?.title}</div>
                    <div className="text-orange-600 text-xs mt-1">
                      {t('dueDate', { date: new Date(task.dueDate).toLocaleDateString() })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">{t('noUpcomingDeadlines')}</p>
          )}
        </div>
      </div>

      {recentReports.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> {t('recentReports')}
          </h4>
          <div className="space-y-3">
            {recentReports.slice(0, 3).map((report: any) => (
              <div key={report.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2">{report.content}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onViewChange('reports')} className="text-indigo-600 hover:underline text-sm mt-4">
            {t('viewAllReports')}
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
        <h4 className="text-lg font-semibold mb-2">{t('keepUpTheGreatWork')}</h4>
        <p className="text-indigo-100 mb-4">
          {stats.completedTasks > 0
            ? t('completedTasksMessage', { count: stats.completedTasks })
            : t('startCompletingTasksMessage')}
        </p>
        <button onClick={() => onViewChange('courses')} className="px-6 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50">
          {t('viewCourses')}
        </button>
      </div>
    </div>
  );
}
