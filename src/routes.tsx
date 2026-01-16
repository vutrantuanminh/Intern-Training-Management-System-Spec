
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { TraineeDashboard } from './components/TraineeDashboard';
import { TraineeCourses } from './components/trainee/TraineeCourses';
import { DailyReports } from './components/trainee/DailyReports';
import { TraineePullRequestView } from './components/trainee/TraineePullRequestView';
import { ChatInterface } from './components/shared/ChatInterface';
import { GitHubSettings } from './components/settings/GitHubSettings';
import { User } from './types';

// Dummy user for now; replace with real auth context
const dummyUser: User = {
    id: '1',
    name: 'Trainee',
    email: 'trainee@example.com',
    role: 'trainee',
};

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />

                {/* Admin only */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminLayout />
                    </ProtectedRoute>
                } />

                {/* Trainer/Supervisor */}
                <Route path="/trainer/*" element={
                    <ProtectedRoute allowedRoles={['TRAINER', 'SUPERVISOR', 'ADMIN']}>
                        <TrainerLayout />
                    </ProtectedRoute>
                } />

                {/* Trainee with nested routes */}
                <Route path="/trainee" element={
                    <ProtectedRoute allowedRoles={['TRAINEE']}>
                        <TraineeLayout user={dummyUser} />
                    </ProtectedRoute>
                }>
                    <Route index element={<TraineeDashboard user={dummyUser} onLogout={() => {}} />} />
                    <Route path="dashboard" element={<TraineeDashboard user={dummyUser} onLogout={() => {}} />} />
                    <Route path="courses" element={<TraineeCourses traineeId={dummyUser.id} />} />
                    {/* TODO: Add nested course/subject routes here */}
                    <Route path="reports" element={<DailyReports traineeId={dummyUser.id} />} />
                    <Route path="pull-requests" element={<TraineePullRequestView traineeId={dummyUser.id} />} />
                    <Route path="chat" element={<ChatInterface currentUserId={dummyUser.id} />} />
                    <Route path="settings" element={<GitHubSettings />} />
                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

// Real TraineeLayout with sidebar and Outlet
import { DashboardLayout } from './components/DashboardLayout';
import { LayoutDashboard, BookOpen, FileText, GitPullRequest, MessageSquare, Settings } from 'lucide-react';

function TraineeLayout({ user }: { user: User }) {
    // TODO: Replace with real logout and notification logic
    const { t } = useTranslation();
    const menuItems = [
        { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
        { id: 'courses', label: t('myCourses'), icon: <BookOpen className="w-5 h-5" />, path: 'courses' },
        { id: 'reports', label: t('dailyReports'), icon: <FileText className="w-5 h-5" />, path: 'reports' },
        { id: 'pull-requests', label: t('pullRequests'), icon: <GitPullRequest className="w-5 h-5" />, path: 'pull-requests' },
        { id: 'chat', label: t('messages'), icon: <MessageSquare className="w-5 h-5" />, path: 'chat' },
        { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" />, path: 'settings' },
    ];

    // Use React Router navigation for menu
    return (
        <DashboardLayout
            user={user}
            currentView={''}
            onViewChange={() => {}}
            onLogout={() => {}}
            menuItems={menuItems.map(({ id, label, icon, path }) => ({ id, label, icon }))}
        >
            <Outlet />
        </DashboardLayout>
    );
}


// Placeholder components
function DashboardPage() {
    return <div>Dashboard</div>;
}

function AdminLayout() {
    return <div>Admin Panel</div>;
}

function TrainerLayout() {
    return <div>Trainer Panel</div>;
}



function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">403</h1>
                <p className="text-xl mb-4">Unauthorized Access</p>
                <a href="/dashboard" className="text-blue-600 hover:underline">
                    Go to Dashboard
                </a>
            </div>
        </div>
    );
}
