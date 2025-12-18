import { api } from '../lib/apiClient';

export interface User {
    id: number;
    email: string;
    fullName: string;
    avatar?: string;
    roles: any[];
    isEmailVerified: boolean;
}

export const userService = {
    getUsers: async (params?: Record<string, any>) => {
        const query = new URLSearchParams(params).toString();
        return api.get<{ data: User[]; pagination: any }>(`/users?${query}`);
    },

    getUserById: async (id: number) => {
        return api.get<{ data: User }>(`/users/${id}`);
    },

    createUser: async (data: any) => {
        return api.post<{ message: string; data: User }>('/users', data);
    },

    updateUser: async (id: number, data: any) => {
        return api.put<{ message: string; data: User }>(`/users/${id}`, data);
    },

    deleteUser: async (id: number) => {
        return api.delete<{ message: string }>(`/users/${id}`);
    },

    getProfile: async () => {
        return api.get<{ data: User }>('/users/profile');
    },

    updateProfile: async (data: { fullName?: string; avatar?: string }) => {
        return api.put<{ message: string; data: User }>('/users/profile', data);
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        return api.put<{ message: string }>('/users/change-password', {
            currentPassword,
            newPassword,
        });
    },

    uploadAvatar: async (file: File) => {
        return api.uploadFile<{ message: string; avatarUrl: string }>('/upload/avatar', file, 'avatar');
    },

    deleteAvatar: async () => {
        return api.delete<{ message: string }>('/upload/avatar');
    },
};
