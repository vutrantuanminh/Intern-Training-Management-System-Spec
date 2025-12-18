import { useEffect, useState } from 'react';
import { authService, AuthResponse } from '../services/authService';
import { auth } from '../config/api';
import { socketService } from '../services/socketService';

export function useAuth() {
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const token = auth.getToken();
        if (token) {
            // You might want to verify token or fetch user profile here
            // For now, we'll assume token is valid
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            auth.setToken(response.accessToken);
            auth.setRefreshToken(response.refreshToken);
            setUser(response.user);

            // Connect socket after login
            socketService.connect();

            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        auth.clearTokens();
        setUser(null);
        socketService.disconnect();
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!auth.getToken(),
    };
}
