import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { user } = useAuth();

    if (!user) {
        return <>{fallback}</>;
    }

    const userRoles = user.roles.map((r: any) => r.name || r);
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Hook for checking permissions
export function usePermission(allowedRoles: string[]): boolean {
    const { user } = useAuth();

    if (!user) return false;

    const userRoles = user.roles.map((r: any) => r.name || r);
    return allowedRoles.some(role => userRoles.includes(role));
}
