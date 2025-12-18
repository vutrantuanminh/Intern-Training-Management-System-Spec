import { api } from '../lib/apiClient';

export interface Course {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    subjectCount: number;
    trainers: any[];
    trainees: any[];
    createdAt: string;
}

export interface CreateCourseData {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    subjects: {
        title: string;
        order?: number;
        tasks: {
            title: string;
            description?: string;
            dueDate?: string;
            order?: number;
        }[];
    }[];
    trainerIds?: number[];
}

export const courseService = {
    getCourses: async (params?: Record<string, any>) => {
        const query = new URLSearchParams(params).toString();
        return api.get<{ data: Course[]; pagination: any }>(`/courses?${query}`);
    },

    getCourseById: async (id: number) => {
        return api.get<{ data: Course }>(`/courses/${id}`);
    },

    createCourse: async (data: CreateCourseData) => {
        return api.post<{ message: string; data: Course }>('/courses', data);
    },

    updateCourse: async (id: number, data: Partial<CreateCourseData>) => {
        return api.put<{ message: string; data: Course }>(`/courses/${id}`, data);
    },

    deleteCourse: async (id: number) => {
        return api.delete<{ message: string }>(`/courses/${id}`);
    },

    cloneCourse: async (id: number, data: { title?: string; startDate?: string; endDate?: string }) => {
        return api.post<{ message: string; data: Course }>(`/courses/${id}/clone`, data);
    },

    assignTrainers: async (id: number, trainerIds: number[]) => {
        return api.post<{ message: string }>(`/courses/${id}/trainers`, { trainerIds });
    },

    addTrainees: async (id: number, traineeIds: number[]) => {
        return api.post<{ message: string }>(`/courses/${id}/trainees`, { traineeIds });
    },

    removeTrainee: async (courseId: number, traineeId: number) => {
        return api.delete<{ message: string }>(`/courses/${courseId}/trainees/${traineeId}`);
    },
};
