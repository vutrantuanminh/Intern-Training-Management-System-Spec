const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const config = {
    apiUrl: API_URL,
    socketUrl: SOCKET_URL,
};

// Token management with expiry and auto-logout support.
// Token TTL hours can be configured via VITE_TOKEN_TTL_HOURS (default 10).
const TOKEN_TTL_HOURS = Number(import.meta.env.VITE_TOKEN_TTL_HOURS) || 10;

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_EXPIRY_KEY = 'accessTokenExpiry';

export const auth = {
    getToken: () => {
        const expiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
        if (expiry) {
            const expiryMs = Number(expiry);
            if (Date.now() > expiryMs) {
                // token expired
                auth.clearTokens();
                return null;
            }
        }
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    getTokenExpiry: () => {
        const expiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
        return expiry ? Number(expiry) : null;
    },
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setToken: (token: string, expiresAt?: number) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        if (typeof expiresAt === 'number') {
            localStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, String(expiresAt));
        } else {
            const expiryMs = Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000;
            localStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, String(expiryMs));
        }
    },
    setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    clearTokens: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    },
};
