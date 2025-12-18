import { api } from '../lib/apiClient';

export const chatService = {
    getRooms: async () => {
        return api.get('/chat/rooms');
    },

    createRoom: async (data: {
        name?: string;
        participantIds: number[];
        isGroup?: boolean;
    }) => {
        return api.post('/chat/rooms', data);
    },

    getRoomMessages: async (roomId: number, page: number = 1, limit: number = 50) => {
        return api.get(`/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
    },

    sendMessage: async (roomId: number, content: string) => {
        return api.post(`/chat/rooms/${roomId}/messages`, { content });
    },

    leaveRoom: async (roomId: number) => {
        return api.delete(`/chat/rooms/${roomId}`);
    },
};
