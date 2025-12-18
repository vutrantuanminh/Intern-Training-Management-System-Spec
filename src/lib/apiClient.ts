import { config, auth } from '../config/api';

interface RequestOptions extends RequestInit {
    requireAuth?: boolean;
}

class ApiClient {
    private baseUrl: string;
    private csrfToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public setCsrfToken(token: string) {
        this.csrfToken = token;
    }

    private getCsrfToken(): string | null {
        if (this.csrfToken) return this.csrfToken;

        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return value;
            }
        }
        return null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { requireAuth = true, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers as Record<string, string>),
        };

        if (requireAuth) {
            const token = auth.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Add CSRF token for non-GET requests
            const method = fetchOptions.method || 'GET';
            if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                const csrfToken = this.getCsrfToken();
                if (csrfToken) {
                    headers['X-CSRF-Token'] = csrfToken;
                }
            }
        }

        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                credentials: 'include', // Include cookies
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: 'An error occurred',
                }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    async uploadFile<T>(
        endpoint: string,
        file: File,
        fieldName: string = 'file'
    ): Promise<T> {
        const formData = new FormData();
        formData.append(fieldName, file);

        const token = auth.getToken();
        const headers: Record<string, string> = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add CSRF token
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'Upload failed',
            }));
            throw new Error(error.message);
        }

        return await response.json();
    }
}

export const api = new ApiClient(config.apiUrl);
