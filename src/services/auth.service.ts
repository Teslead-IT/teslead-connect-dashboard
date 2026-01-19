/**
 * Authentication API Service
 * All auth-related API calls are centralized here
 */

import { apiClient, setAuthTokens } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import { API_CONFIG } from '@/lib/config';
import type {
    AuthResponse,
    LoginCredentials,
    SignupCredentials,
    VerifyEmailPayload,
    ResetPasswordPayload,
    ChangePasswordPayload,
    User,
} from '@/types/auth';

export const authApi = {
    /**
     * Login with email/username/phone and password
     */
    async loginWithPassword(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.LOGIN_PASSWORD,
            credentials
        );
        return data;
    },

    /**
     * Login with Auth0 (Google, GitHub, etc.)
     */
    async loginWithSocial(auth0Token: string): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.LOGIN_SOCIAL,
            { auth0Token }
        );
        return data;
    },

    /**
     * Sign up with email
     */
    async signupWithEmail(credentials: SignupCredentials): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.SIGNUP_EMAIL,
            credentials
        );
        return data;
    },

    /**
     * Verify email with OTP
     */
    async verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
            payload
        );
        return data;
    },

    /**
     * Step 1: Request OTP for Phone Signup
     */
    async requestPhoneSignup(payload: { phone: string; name: string; orgName?: string }): Promise<{ message: string }> {
        const { data } = await apiClient.post<{ message: string }>(
            API_CONFIG.ENDPOINTS.AUTH.SIGNUP_PHONE_REQUEST,
            payload
        );
        return data;
    },

    /**
     * Step 2: Verify OTP and Set Password for Phone Signup
     */
    async verifyPhoneSignup(payload: { phone: string; otp: string; password: string }): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.SIGNUP_PHONE_VERIFY,
            payload
        );
        return data;
    },

    /**
     * Resend OTP for email verification
     */
    async resendOTP(email: string): Promise<{ message: string }> {
        const { data } = await apiClient.post<{ message: string }>(
            API_CONFIG.ENDPOINTS.AUTH.RESEND_OTP,
            { email }
        );
        return data;
    },

    /**
     * Request password reset (sends OTP)
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
        const { data } = await apiClient.post<{ message: string }>(
            API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
            { email }
        );
        return data;
    },

    /**
     * Reset password with OTP
     */
    async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
        const { data } = await apiClient.post<{ message: string }>(
            API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
            payload
        );
        return data;
    },

    /**
     * Change password (authenticated)
     */
    async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
        const { data } = await apiClient.post<{ message: string }>(
            API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD,
            payload
        );
        return data;
    },

    /**
     * Logout (invalidate tokens on server)
     */
    async logout(): Promise<void> {
        try {
            const refreshToken = tokenStorage.getToken(API_CONFIG.STORAGE.REFRESH_TOKEN);

            // Authorization header (Bearer token) is automatically attached by apiClient interceptor
            await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
                refreshToken
            });
        } catch (error) {
            // Even if server logout fails, we clear local tokens
            console.error('Logout error:', error);
        }
    },

    /**
     * Get Current User Profile
     */
    async getMe(): Promise<AuthResponse> {
        const { data } = await apiClient.get<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.ME
        );
        return data;
    },

    /**
     * Switch current organization
     */
    async switchOrg(orgId: string): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            API_CONFIG.ENDPOINTS.AUTH.SWITCH_ORG,
            { orgId }
        );
        return data;
    },
};
