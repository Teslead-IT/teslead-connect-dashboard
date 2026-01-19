/**
 * API Client with Automatic Token Handling
 * - Attaches access tokens to requests
 * - Auto-refreshes tokens on 401 errors
 * - Handles token expiration gracefully
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { tokenStorage } from './token-storage';

// Create axios instance with base configuration
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * Request Interceptor: Attach Access Token
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor: Auto-Refresh Token on 401
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is not 401 or request already retried, reject immediately
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Don't retry refresh or login endpoints
        if (
            originalRequest.url?.includes(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN) ||
            originalRequest.url?.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN_PASSWORD)
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axios(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = tokenStorage.getToken(API_CONFIG.STORAGE.REFRESH_TOKEN);

        if (!refreshToken) {
            // No refresh token available, logout
            handleLogout();
            return Promise.reject(error);
        }

        try {
            // Attempt to refresh the token
            const { data } = await axios.post(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`,
                { refreshToken }
            );

            const newAccessToken = data.accessToken;
            const newRefreshToken = data.refreshToken; // Backend returns new refresh token

            // Save both new access token and new refresh token
            tokenStorage.setToken(API_CONFIG.STORAGE.ACCESS_TOKEN, newAccessToken);

            // Only update refresh token if the backend returns a new one
            if (newRefreshToken) {
                tokenStorage.setToken(API_CONFIG.STORAGE.REFRESH_TOKEN, newRefreshToken);
            }

            // Update authorization header
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            // Process queued requests
            processQueue(null, newAccessToken);

            // Retry original request
            return axios(originalRequest);
        } catch (refreshError) {
            // Refresh failed (e.g. 403 Revoked), logout user
            processQueue(refreshError as Error, null);
            handleLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

/**
 * Logout Handler: Clear tokens and redirect
 */
function handleLogout() {
    tokenStorage.clearAll();

    // Only redirect if we're in the browser and NOT on an auth or invite page
    if (typeof window !== 'undefined') {
        if (!window.location.pathname.startsWith('/auth/') && !window.location.pathname.startsWith('/invites/')) {
            window.location.href = '/auth/login';
        }
    }
}

/**
 * Helper function to set auth tokens
 */
export function setAuthTokens(accessToken: string, refreshToken?: string) {
    tokenStorage.setToken(API_CONFIG.STORAGE.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
        tokenStorage.setToken(API_CONFIG.STORAGE.REFRESH_TOKEN, refreshToken);
    }
}

/**
 * Helper function to set full auth session (tokens + user)
 */
export function setAuthSession(accessToken: string, refreshToken: string | undefined, user: any) {
    setAuthTokens(accessToken, refreshToken);
    tokenStorage.setUser(user);
}

/**
 * Helper function to clear auth tokens and user data
 */
export function clearAuthTokens() {
    tokenStorage.removeToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
    tokenStorage.removeToken(API_CONFIG.STORAGE.REFRESH_TOKEN);
    tokenStorage.removeUser();
}

export default apiClient;
