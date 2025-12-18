import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    requireAuth?: boolean;
}

export function ProtectedRoute({
    children,
    allowedRoles,
    requireAuth = true
}: ProtectedRouteProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user) {
        const userRoles = user.roles.map((r: any) => r.name || r);
        const hasPermission = allowedRoles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
}
