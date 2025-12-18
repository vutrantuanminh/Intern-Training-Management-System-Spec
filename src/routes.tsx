import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

// Example route configuration
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

                {/* Trainee */}
                <Route path="/trainee/*" element={
                    <ProtectedRoute allowedRoles={['TRAINEE']}>
                        <TraineeLayout />
                    </ProtectedRoute>
                } />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
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

function TraineeLayout() {
    return <div>Trainee Panel</div>;
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
