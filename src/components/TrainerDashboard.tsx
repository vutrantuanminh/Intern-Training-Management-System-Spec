import { useState, useEffect } from 'react';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { TrainerCourses } from './trainer/TrainerCourses';
import { PullRequestManagement } from './trainer/PullRequestManagement';
import { TraineeReportsView } from './trainer/TraineeReportsView';
import { LayoutDashboard, BookOpen, GitPullRequest, MessageSquare, Users, Loader2, FileText } from 'lucide-react';
import { ChatInterface } from './shared/ChatInterface';
import { trainerService } from '../services/trainerService';
import { api } from '../lib/apiClient';

interface TrainerDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TrainerDashboard({ user, onLogout }: TrainerDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'pull-requests', label: 'Pull Requests', icon: <GitPullRequest className="w-5 h-5" /> },
    { id: 'reports', label: 'Trainee Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'chat', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={onLogout}
      menuItems={menuItems}
      notifications={2}
    >
      {currentView === 'dashboard' && <TrainerOverview />}
      {currentView === 'courses' && <TrainerCourses trainerId={user.id} />}
      {currentView === 'pull-requests' && <PullRequestManagement trainerId={user.id} />}
      {currentView === 'reports' && <TraineeReportsView />}
      {currentView === 'chat' && <ChatInterface currentUserId={user.id} />}
    </DashboardLayout>
  );
}

function TrainerOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [coursesRes, prsRes]: any[] = await Promise.all([
        trainerService.getCourses(),
        api.get('/pull-requests?limit=5'),
      ]);

      const courses = coursesRes.data || [];
      const prs = prsRes.data || [];
      const activeCourses = courses.filter((c: any) => c.status === 'IN_PROGRESS');
      const totalTrainees = courses.reduce((sum: number, c: any) => sum + (c.traineeCount || 0), 0);
      const pendingPRs = prs.filter((pr: any) => pr.status === 'PENDING');

      setData({
        courses,
        activeCourses,
        totalTrainees,
        pendingPRs: pendingPRs.length,
        recentPRs: prs.slice(0, 5),
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h3>
        <p className="text-gray-600 mt-1">Overview of your courses and trainee progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">My Courses</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.courses.length}</div>
          <div className="text-blue-600 text-sm mt-1">{data.activeCourses.length} active</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">My Trainees</span>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.totalTrainees}</div>
          <div className="text-gray-600 text-sm mt-1">Active learners</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Pending PRs</span>
            <div className="p-2 bg-purple-100 rounded-lg">
              <GitPullRequest className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.pendingPRs}</div>
          <div className="text-red-600 text-sm mt-1">Needs review</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Active Subjects</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.courses.reduce((sum: number, c: any) => sum + (c.subjectCount || 0), 0)}
          </div>
          <div className="text-green-600 text-sm mt-1">Across all courses</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pull Requests */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-purple-600" /> Recent Pull Requests
          </h4>
          {data.recentPRs.length > 0 ? (
            <div className="space-y-3">
              {data.recentPRs.map((pr: any) => (
                <div key={pr.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{pr.title}</div>
                      <div className="text-gray-600 text-sm">
                        {pr.trainee?.fullName} • {new Date(pr.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${pr.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      pr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {pr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pull requests yet</p>
          )}
        </div>

        {/* My Courses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> My Courses
          </h4>
          {data.courses.length > 0 ? (
            <div className="space-y-3">
              {data.courses.slice(0, 5).map((course: any) => (
                <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900">{course.title}</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      course.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {course.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm">
                    {course.traineeCount || 0} trainees • {course.subjectCount || 0} subjects
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No courses assigned yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

