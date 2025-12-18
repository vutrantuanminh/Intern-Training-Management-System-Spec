import { api } from '../lib/apiClient';

export const pullRequestService = {
    getPullRequests: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        traineeId?: number;
    }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get(`/pull-requests?${query}`);
    },

    getPullRequestById: async (id: number) => {
        return api.get(`/pull-requests/${id}`);
    },

    createPullRequest: async (data: {
        title: string;
        description?: string;
        repoUrl: string;
    }) => {
        return api.post('/pull-requests', data);
    },

    updatePullRequest: async (id: number, data: {
        status?: string;
        title?: string;
        description?: string;
    }) => {
        return api.put(`/pull-requests/${id}`, data);
    },

    addComment: async (id: number, content: string) => {
        return api.post(`/pull-requests/${id}/comments`, { content });
    },

    approvePullRequest: async (id: number) => {
        return api.put(`/pull-requests/${id}/approve`);
    },

    rejectPullRequest: async (id: number, reason?: string) => {
        return api.put(`/pull-requests/${id}/reject`, { reason });
    },

    deletePullRequest: async (id: number) => {
        return api.delete(`/pull-requests/${id}`);
    },
};
