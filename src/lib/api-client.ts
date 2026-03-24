/**
 * API Client with Automatic Token Handling
 * - Attaches access tokens to requests
 * - Attaches x-org-id from org store (Model A: header-only tenant context)
 * - Throws if org required but not selected
 * - Auto-refreshes tokens on 401 errors
 * - Handles token expiration gracefully
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { tokenStorage } from './token-storage';
import { useOrgStore } from '@/stores/orgStore';
import { useProjectStore } from '@/stores/projectStore';

// Create axios instance with base configuration
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

/** Routes that do not require org context (auth, invite accept, etc.) */
function isOrgScopedRoute(url?: string): boolean {
    if (!url) return false;
    const path = url.replace(API_CONFIG.BASE_URL, '').split('?')[0];
    return !path.startsWith('/auth') && !path.startsWith('/invites/accept') && !path.startsWith('/invites/reject');
}

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
 * Request Interceptor: Attach Access Token + x-org-id (Model A)
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
        const orgId = useOrgStore.getState().activeOrgId;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (!orgId && isOrgScopedRoute(config.url)) {
            throw new Error('Organization not selected');
        }

        if (orgId && config.headers) {
            config.headers['x-org-id'] = orgId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/** Handler for 403 (permission denied). Set by app to show toast. Do not retry or mask. */
let on403Handler: (() => void) | null = null;
export function setOn403Handler(handler: (() => void) | null) {
    on403Handler = handler;
}

/**
 * Response Interceptor: 403 → show permission toast; 401 → auto-refresh
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 403: Permission denied — show toast, do not retry, do not mask
        if (error.response?.status === 403) {
            on403Handler?.();
            return Promise.reject(error);
        }

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
 * Logout Handler: Clear tokens, org context, and redirect
 */
function handleLogout() {
    tokenStorage.clearAll();
    useOrgStore.getState().clearOrg();
    useProjectStore.getState().clearProject();

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
 * Helper function to set full auth session (tokens only; user lives in React Query cache / Zustand)
 * Do not persist user/role to localStorage — always derive from fresh /auth/me and org selection.
 */
export function setAuthSession(accessToken: string, refreshToken: string | undefined, _user?: any) {
    setAuthTokens(accessToken, refreshToken);
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
