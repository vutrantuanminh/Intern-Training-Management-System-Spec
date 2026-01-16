import { useEffect, useState, useRef } from 'react';
import { authService, AuthResponse } from '../services/authService';
import { auth } from '../config/api';
import { socketService } from '../services/socketService';

export function useAuth() {
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);
    const [loading, setLoading] = useState(true);
    const logoutTimerRef = useRef<number | null>(null);

    useEffect(() => {
        // Check if user is logged in
        const token = auth.getToken();
        if (token) {
            // Schedule auto-logout when token expires
            const expiry = auth.getTokenExpiry();
            if (expiry) {
                const msLeft = expiry - Date.now();
                if (msLeft <= 0) {
                    // already expired
                    auth.clearTokens();
                    setUser(null);
                } else {
                    // set a timer to logout when expired
                    if (logoutTimerRef.current) {
                        clearTimeout(logoutTimerRef.current);
                    }
                    logoutTimerRef.current = window.setTimeout(() => {
                        auth.clearTokens();
                        setUser(null);
                        socketService.disconnect();
                        // reload to update UI state
                        window.location.reload();
                    }, msLeft);
                }
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            // Prefer server-provided expiry when available
            auth.setToken(response.accessToken, response.expiresAt ?? undefined);
            auth.setRefreshToken(response.refreshToken);
            setUser(response.user);

            // Connect socket after login
            socketService.connect();

            // Setup auto-logout timer based on token expiry
            const expiry = auth.getTokenExpiry();
            if (expiry) {
                const msLeft = expiry - Date.now();
                if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
                logoutTimerRef.current = window.setTimeout(() => {
                    auth.clearTokens();
                    setUser(null);
                    socketService.disconnect();
                    window.location.reload();
                }, msLeft);
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        auth.clearTokens();
        setUser(null);
        socketService.disconnect();
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!auth.getToken(),
    };
}
