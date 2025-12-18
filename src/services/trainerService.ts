import { api } from '../lib/apiClient';

export const trainerService = {
    getCourses: async () => {
        return api.get('/trainer/courses');
    },

    getCourseTrainees: async (courseId: number) => {
        return api.get(`/trainer/courses/${courseId}/trainees`);
    },

    getDashboard: async () => {
        return api.get('/trainer/dashboard');
    },
};

export const supervisorService = {
    // Trainees
    getAllTrainees: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        courseId?: number;
        status?: string;
    }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get(`/supervisor/trainees?${query}`);
    },

    getTraineeDetails: async (id: number) => {
        return api.get(`/supervisor/trainee/${id}/details`);
    },

    getTraineeStatistics: async () => {
        return api.get('/supervisor/trainee-statistics');
    },

    // Dashboard
    getDashboard: async () => {
        return api.get('/supervisor/dashboard');
    },

    // Supervisors
    getAllSupervisors: async () => {
        return api.get('/supervisor/supervisors');
    },

    // Trainers (for assigning to courses)
    getAllTrainers: async () => {
        return api.get('/supervisor/trainers');
    },

    // Trainee status
    updateTraineeStatus: async (courseId: number, traineeId: number, status: string) => {
        return api.put(`/courses/${courseId}/trainees/${traineeId}/status`, { status });
    },
};

export const courseManagementService = {
    // Course CRUD
    getCourses: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        myTrainerCourses?: boolean;
    }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get(`/courses?${query}`);
    },

    getCourseById: async (id: number) => {
        return api.get(`/courses/${id}`);
    },

    createCourse: async (data: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        subjects: Array<{
            title: string;
            description?: string;
            tasks: Array<{ title: string; description?: string }>;
        }>;
        trainerIds?: number[];
    }) => {
        return api.post('/courses', data);
    },

    updateCourse: async (id: number, data: any) => {
        return api.put(`/courses/${id}`, data);
    },

    deleteCourse: async (id: number) => {
        return api.delete(`/courses/${id}`);
    },

    cloneCourse: async (id: number, data?: { title?: string; startDate?: string; endDate?: string }) => {
        return api.post(`/courses/${id}/clone`, data);
    },

    // Trainer management
    assignTrainers: async (courseId: number, trainerIds: number[]) => {
        return api.post(`/courses/${courseId}/trainers`, { trainerIds });
    },

    // Trainee management
    addTrainees: async (courseId: number, traineeIds: number[]) => {
        return api.post(`/courses/${courseId}/trainees`, { traineeIds });
    },

    removeTrainee: async (courseId: number, traineeId: number) => {
        return api.delete(`/courses/${courseId}/trainees/${traineeId}`);
    },

    // Subject management
    addSubject: async (courseId: number, data: { title: string; description?: string; tasks: Array<{ title: string }> }) => {
        return api.post(`/courses/${courseId}/subjects`, data);
    },

    updateSubject: async (subjectId: number, data: any) => {
        return api.put(`/subjects/${subjectId}`, data);
    },

    deleteSubject: async (subjectId: number) => {
        return api.delete(`/subjects/${subjectId}`);
    },

    // Course lifecycle
    startCourse: async (courseId: number) => {
        return api.post(`/courses/${courseId}/start`);
    },

    finishCourse: async (courseId: number) => {
        return api.post(`/courses/${courseId}/finish`);
    },

    // Subject lifecycle
    startSubject: async (subjectId: number) => {
        return api.post(`/subjects/${subjectId}/start`);
    },

    finishSubject: async (subjectId: number) => {
        return api.post(`/subjects/${subjectId}/finish`);
    },
};
