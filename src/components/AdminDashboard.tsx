import { useState } from 'react';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { UserManagement } from './admin/UserManagement';
import { AllCourses } from './admin/AllCourses';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { TraineeManagement } from './admin/TraineeManagement';
import { LayoutDashboard, Users, BookOpen, GraduationCap } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { id: 'courses', label: 'All Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'trainees', label: 'Trainees', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={onLogout}
      menuItems={menuItems}
    >
      {currentView === 'dashboard' && <AdminDashboardOverview onNavigate={setCurrentView} />}
      {currentView === 'users' && <UserManagement />}
      {currentView === 'courses' && <AllCourses />}
      {currentView === 'trainees' && <TraineeManagement />}
    </DashboardLayout>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">System Overview</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Users</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-gray-900">156</div>
          <div className="text-green-600 text-sm mt-1">+12 this month</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Active Courses</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-gray-900">24</div>
          <div className="text-blue-600 text-sm mt-1">8 in progress</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Trainees</span>
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-gray-900">89</div>
          <div className="text-gray-600 text-sm mt-1">Active learners</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Completion Rate</span>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-gray-900">87%</div>
          <div className="text-green-600 text-sm mt-1">+5% from last month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="mb-4">Recent Activity</h4>
          <div className="space-y-4">
            {[
              { action: 'New user registered', user: 'John Doe', time: '5 minutes ago' },
              { action: 'Course completed', user: 'Jane Smith', time: '1 hour ago' },
              { action: 'New course created', user: 'Sarah Johnson', time: '3 hours ago' },
              { action: 'User role updated', user: 'Mike Wilson', time: '5 hours ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-gray-900">{activity.action}</div>
                  <div className="text-gray-600 text-sm">{activity.user} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="mb-4">System Status</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Server Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Online</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Healthy</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Storage Usage</span>
                <span className="text-gray-600">42%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
