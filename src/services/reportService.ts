import { api } from '../lib/apiClient';

export const reportService = {
    getDailyReports: async (params?: {
        page?: number;
        limit?: number;
        traineeId?: number;
        date?: string;
        search?: string;
    }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get(`/daily-reports?${query}`);
    },

    getReportById: async (id: number) => {
        return api.get(`/daily-reports/${id}`);
    },

    createReport: async (data: { content: string; date: string }) => {
        return api.post('/daily-reports', data);
    },

    updateReport: async (id: number, data: { content?: string; date?: string }) => {
        return api.put(`/daily-reports/${id}`, data);
    },

    deleteReport: async (id: number) => {
        return api.delete(`/daily-reports/${id}`);
    },

    // Report templates
    getTemplates: async () => {
        return api.get('/daily-reports/templates/all');
    },

    createTemplate: async (data: { title: string; content: string }) => {
        return api.post('/daily-reports/templates', data);
    },

    updateTemplate: async (id: number, data: { title?: string; content?: string }) => {
        return api.put(`/daily-reports/templates/${id}`, data);
    },

    deleteTemplate: async (id: number) => {
        return api.delete(`/daily-reports/templates/${id}`);
    },
};
