import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { UserManagement } from './admin/UserManagement';
import { AllCourses } from './admin/AllCourses';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { TraineeManagement } from './admin/TraineeManagement';
import { CourseRepoManagement } from './admin/CourseRepoManagement';
import { GitHubSettings } from './settings/GitHubSettings';
import { LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Github, BarChart3 } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const { t } = useTranslation();
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: t('userManagement'), icon: <Users className="w-5 h-5" /> },
    { id: 'courses', label: t('allCourses'), icon: <BookOpen className="w-5 h-5" /> },
    { id: 'trainees', label: t('trainees'), icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'github-repos', label: t('githubRepos'), icon: <Github className="w-5 h-5" /> },
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
      {currentView === 'dashboard' && <AdminDashboardOverview onNavigate={setCurrentView} />}
      {currentView === 'users' && <UserManagement />}
      {currentView === 'courses' && <AllCourses />}
      {currentView === 'trainees' && <TraineeManagement />}
      {currentView === 'github-repos' && <CourseRepoManagement />}
      {currentView === 'settings' && <GitHubSettings />}
    </DashboardLayout>
  );
}

function AdminOverview() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">{t('systemOverview')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* All text already uses t() for i18n */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All text already uses t() for i18n */}
      </div>
    </div>
  );
}
