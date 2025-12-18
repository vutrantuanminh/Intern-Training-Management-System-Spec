const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const config = {
    apiUrl: API_URL,
    socketUrl: SOCKET_URL,
};

// Token management
export const auth = {
    getToken: () => localStorage.getItem('accessToken'),
    getRefreshToken: () => localStorage.getItem('refreshToken'),
    setToken: (token: string) => localStorage.setItem('accessToken', token),
    setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
};
