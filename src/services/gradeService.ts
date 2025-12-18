import { api } from '../lib/apiClient';

export const gradeService = {
    gradeTask: async (data: {
        taskId: number;
        traineeId: number;
        score: number;
        comment?: string;
    }) => {
        return api.post('/grades', data);
    },

    getTaskGrades: async (taskId: number) => {
        return api.get(`/grades/task/${taskId}`);
    },

    getTraineeGrades: async (traineeId: number, courseId?: number) => {
        const query = courseId ? `?courseId=${courseId}` : '';
        return api.get(`/grades/trainee/${traineeId}${query}`);
    },

    getCourseGrades: async (courseId: number) => {
        return api.get(`/grades/course/${courseId}`);
    },

    deleteGrade: async (taskId: number, traineeId: number) => {
        return api.delete(`/grades/${taskId}/${traineeId}`);
    },
};
