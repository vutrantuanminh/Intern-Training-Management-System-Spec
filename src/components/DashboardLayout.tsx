import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

interface DashboardLayoutProps {
  user: User;
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  menuItems: Array<{ id: string; label: string; icon: ReactNode }>;
  notifications?: number;
}

export function DashboardLayout({
  user,
  children,
  currentView,
  onViewChange,
  onLogout,
  menuItems,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'supervisor': return 'bg-blue-100 text-blue-700';
      case 'trainer': return 'bg-green-100 text-green-700';
      case 'trainee': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            aria-label={t('toggleSidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('systemTitle')}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
            aria-label={t('switchLanguage')}
          >
            {i18n.language === 'en' ? t('english') : t('vietnamese') }
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {t(user.role)}
          </span>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
              aria-label={t('userMenu')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0)}
              </div>
              <span className="hidden md:block text-gray-700 font-medium">{user.name}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="fixed right-5 top-16 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500 text-sm">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed left, overlay for mobile */}
        <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-[9999] bg-white border-r border-gray-200 transition-[width] duration-200 ease-in-out flex flex-col ${sidebarOpen ? 'w-64' : 'w-20 hover:w-64 group'} hidden lg:flex`}> 
          <nav className="flex-1 flex flex-col justify-start items-stretch py-4 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-base font-medium ${currentView === item.id
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-700'
                }`}
                style={{ justifyContent: 'flex-start' }}
                aria-label={t('navigateTo', { section: item.label })}
                title={item.label}
              >
                <div className="flex items-center justify-center w-6 h-6">{item.icon}</div>
                <span className={`ml-2 transition-opacity duration-150 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span className="text-sm">{t('collapse')}</span>
                </>
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </aside>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)}>
            <aside className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-label={t('navigateTo', { section: item.label })}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}
        {/* Main Content - margin left for sidebar */}
        <main className={`flex-1 overflow-auto p-6 ml-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {menuItems.find(m => m.id === currentView)?.label || t('dashboard')}
            </h2>
          </div>
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>
      {/* Footer */}
      <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="text-gray-500 text-sm">
          {t('copyright', { year: new Date().getFullYear(), system: t('systemTitle') })} {t('allRightsReserved')}
        </div>
        <div className="text-gray-400 text-sm hidden md:block">
          {t('version')} 1.0.0
        </div>
      </footer>
    </div>
  );
}
