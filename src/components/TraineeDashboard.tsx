import { useState, useEffect } from 'react';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { TraineeCourses } from './trainee/TraineeCourses';
import { DailyReports } from './trainee/DailyReports';
import { TraineePullRequests } from './trainee/TraineePullRequests';
import { ChatInterface } from './shared/ChatInterface';
import { LayoutDashboard, BookOpen, FileText, GitPullRequest, MessageSquare, Loader2, Calendar, CheckCircle } from 'lucide-react';
import { api } from '../lib/apiClient';

interface TraineeDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TraineeDashboard({ user, onLogout }: TraineeDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'reports', label: 'Daily Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'pull-requests', label: 'Pull Requests', icon: <GitPullRequest className="w-5 h-5" /> },
    { id: 'chat', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
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
      {currentView === 'pull-requests' && <TraineePullRequests traineeId={user.id} />}
      {currentView === 'chat' && <ChatInterface currentUserId={user.id} />}
    </DashboardLayout>
  );
}

function TraineeOverview({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>;
  }

  const stats = data.statistics || {};
  const courses = data.courses || [];
  const upcomingTasks = data.upcomingDeadlines || [];
  const recentReports = data.recentReports || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">My Dashboard</h3>
        <p className="text-gray-600 mt-1">Track your learning progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Enrolled Courses</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCourses || 0}</div>
          <div className="text-blue-600 text-sm mt-1">{stats.activeCourses || 0} in progress</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Completed Tasks</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.completedTasks || 0}/{stats.totalTasks || 0}
          </div>
          <div className="text-green-600 text-sm mt-1">
            {stats.completionRate || 0}% complete
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Pull Requests</span>
            <div className="p-2 bg-purple-100 rounded-lg">
              <GitPullRequest className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPRs || 0}</div>
          <div className="text-green-600 text-sm mt-1">{stats.approvedPRs || 0} approved</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Daily Reports</span>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalReports || 0}</div>
          <div className="text-green-600 text-sm mt-1">Keep it up!</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Course Progress
          </h4>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.slice(0, 3).map((course: any) => (
                <div key={course.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{course.title}</span>
                    <span className="text-gray-600 text-sm">
                      {course.completedTasks || 0}/{course.totalTasks || 0} tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                  <div className="text-gray-600 text-sm">{Math.round(course.progress || 0)}% complete</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No courses enrolled yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" /> Upcoming Deadlines
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
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
          )}
        </div>
      </div>

      {recentReports.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Recent Reports
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
            View all reports →
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
        <h4 className="text-lg font-semibold mb-2">Keep up the great work!</h4>
        <p className="text-indigo-100 mb-4">
          {stats.completedTasks > 0
            ? `You've completed ${stats.completedTasks} tasks. Keep pushing forward!`
            : 'Start completing tasks to track your progress here.'}
        </p>
        <button onClick={() => onViewChange('courses')} className="px-6 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50">
          View Courses
        </button>
      </div>
    </div>
  );
}
