import { api } from '../lib/apiClient';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    roleNames: string[];
}

export interface User {
    id: number;
    email: string;
    fullName: string;
    avatar?: string;
    roles: string[];
    isEmailVerified: boolean;
}

export interface AuthResponse {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresAt?: number | null;
    user: User;
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return api.post('/auth/login', credentials, { requireAuth: false });
    },

    getCsrfToken: async () => {
        return api.get('/auth/csrf', { requireAuth: false });
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        return api.post('/auth/register', data);
    },

    verifyEmail: async (token: string) => {
        return api.get(`/auth/verify-email/${token}`, { requireAuth: false });
    },

    resendVerification: async (email: string) => {
        return api.post('/auth/resend-verification', { email }, { requireAuth: false });
    },

    forgotPassword: async (email: string) => {
        return api.post('/auth/forgot-password', { email }, { requireAuth: false });
    },

    resetPassword: async (token: string, newPassword: string) => {
        return api.post('/auth/reset-password', { token, newPassword }, { requireAuth: false });
    },
};
