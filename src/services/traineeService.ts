import { api } from '../lib/apiClient';

export const traineeService = {
    getProgress: async () => {
        return api.get('/trainee/progress');
    },

    getCourseProgress: async (courseId: number) => {
        return api.get(`/trainee/courses/${courseId}/progress`);
    },

    completeSubject: async (subjectId: number) => {
        return api.post(`/trainee/subjects/${subjectId}/complete`);
    },

    getDashboard: async () => {
        return api.get('/trainee/dashboard');
    },

    // Task operations
    completeTask: async (taskId: number) => {
        return api.post(`/tasks/${taskId}/complete`);
    },

    uncompleteTask: async (taskId: number) => {
        return api.post(`/tasks/${taskId}/uncomplete`);
    },

    uploadTaskFile: async (taskId: number, files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return api.uploadFile(`/tasks/${taskId}/upload`, files[0], 'files');
    },

    getTaskFiles: async (taskId: number, traineeId?: number) => {
        const query = traineeId ? `?traineeId=${traineeId}` : '';
        return api.get(`/tasks/${taskId}/files${query}`);
    },
};
