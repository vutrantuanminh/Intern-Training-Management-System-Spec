import { api } from '../lib/apiClient';

export const notificationService = {
    getNotifications: async (params?: { page?: number; limit?: number; isRead?: boolean }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get(`/notifications?${query}`);
    },

    getUnreadCount: async () => {
        return api.get<{ count: number }>('/notifications/unread-count');
    },

    markAsRead: async (id: number) => {
        return api.put(`/notifications/${id}/read`);
    },

    markAllAsRead: async () => {
        return api.put('/notifications/mark-all-read');
    },

    deleteNotification: async (id: number) => {
        return api.delete(`/notifications/${id}`);
    },
};
