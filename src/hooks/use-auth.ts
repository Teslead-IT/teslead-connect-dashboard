/**
 * Authentication Hooks using TanStack Query
 * Provides clean, reusable hooks for all auth operations
 */

'use client';

import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/auth.service';
import { setAuthTokens, clearAuthTokens, setAuthSession } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import { API_CONFIG } from '@/lib/config';
import type {
    AuthResponse,
    LoginCredentials,
    SignupCredentials,
    VerifyEmailPayload,
    User,
    ResetPasswordPayload,
    ChangePasswordPayload,
} from '@/types/auth';

// Query keys for cache management
export const authKeys = {
    all: ['auth'] as const,
    user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook: Get Current User
 * Fetches user data from local storage
 */
export function useUser() {
    return useQuery({
        queryKey: authKeys.user(),
        queryFn: async () => {
            // If no token, return null immediately
            const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
            if (!token) return null;

            try {
                const data = await authApi.getMe();
                // Update local storage with fresh data
                if (data.user) {
                    tokenStorage.setUser(data.user);
                    return data.user;
                }
                return null;
            } catch (error) {
                // If API fails (e.g. network), fall back to storage
                return tokenStorage.getUser() as User | null;
            }
        },
        initialData: () => tokenStorage.getUser() as User | null,
        // Mark as stale immediately/shortly so it tries to fetch on mount
        staleTime: 0,
        gcTime: Infinity,
    });
}

/**
 * Hook: Login with Password
 */
export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authApi.loginWithPassword(credentials),
        onSuccess: (data: AuthResponse) => {
            // Store tokens and user
            setAuthSession(data.accessToken, data.refreshToken, data.user);

            // Cache user data
            queryClient.setQueryData(authKeys.user(), data.user);
        },
    });
}

/**
 * Hook: Sign Up with Email
 */
export function useSignup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: SignupCredentials) => authApi.signupWithEmail(credentials),
        onSuccess: (data: AuthResponse) => {
            // Store tokens and user
            setAuthSession(data.accessToken, data.refreshToken, data.user);

            // Cache user data
            queryClient.setQueryData(authKeys.user(), data.user);
        },
    });
}

/**
 * Hook: Social Login (Auth0)
 */
export function useSocialLogin() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (auth0Token: string) => authApi.loginWithSocial(auth0Token),
        onSuccess: (data: AuthResponse) => {
            // Store tokens and user
            setAuthSession(data.accessToken, data.refreshToken, data.user);

            // Cache user data
            queryClient.setQueryData(authKeys.user(), data.user);

            // Navigate to dashboard (social accounts are pre-verified)
            router.push('/dashboard');
        },
    });
}

/**
 * Hook: Verify Email
 */
export function useVerifyEmail() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (payload: VerifyEmailPayload) => authApi.verifyEmail(payload),
        onSuccess: (data: AuthResponse) => {
            // Update tokens and user
            setAuthSession(data.accessToken, data.refreshToken, data.user);

            // Update cached user
            queryClient.setQueryData(authKeys.user(), data.user);

            router.push('/dashboard');

        },
    });
}

/**
 * Hook: Resend OTP
 */
export function useResendOTP() {
    return useMutation({
        mutationFn: (email: string) => authApi.resendOTP(email),
    });
}

/**
 * Hook: Forgot Password (Request OTP)
 */
export function useForgotPassword() {
    const router = useRouter();

    return useMutation({
        mutationFn: (email: string) => authApi.forgotPassword(email),
        onSuccess: (_, email) => {
            // Navigate to reset password page with email
            router.push(`/auth/reset-password?email=${email}`);
        },
    });
}

/**
 * Hook: Reset Password with OTP
 */
export function useResetPassword() {
    const router = useRouter();

    return useMutation({
        mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
        onSuccess: () => {
            // Navigate to login
            router.push('/auth/login');
        },
    });
}

/**
 * Hook: Change Password (Authenticated)
 */
export function useChangePassword() {
    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    });
}

/**
 * Hook: Logout
 */
export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            // Clear tokens
            clearAuthTokens();

            // Clear all cached data
            queryClient.clear();

            // Redirect to Next.js Auth0 Logout to clear cookie (important for Social Login)
            if (typeof window !== 'undefined') {
                window.location.href = '/api/auth/logout';
            }
        },
        onError: () => {
            // Even on error, clear local state and redirect
            clearAuthTokens();
            queryClient.clear();

            if (typeof window !== 'undefined') {
                window.location.href = '/api/auth/logout';
            }
        },
    });
}

/**
 * Combined Auth Hook - All auth operations in one place
 */
export function useAuth() {
    const { data: user, isLoading: isUserLoading } = useUser();
    const loginMutation = useLogin();
    const signupMutation = useSignup();
    const socialLoginMutation = useSocialLogin();
    const logoutMutation = useLogout();

    return {
        // User state
        user,
        isAuthenticated: !!user,
        isLoading: isUserLoading,

        // Auth actions
        login: loginMutation.mutate,
        signup: signupMutation.mutate,
        socialLogin: socialLoginMutation.mutate,
        logout: logoutMutation.mutate,

        // Mutation states
        isLoginLoading: loginMutation.isPending,
        isSignupLoading: signupMutation.isPending,
        isSocialLoginLoading: socialLoginMutation.isPending,
        isLogoutLoading: logoutMutation.isPending,

        // Errors
        loginError: loginMutation.error,
        signupError: signupMutation.error,
        socialLoginError: socialLoginMutation.error,
    };
}
export const usePhoneSignupRequest = () => {
    return useMutation({
        mutationFn: authApi.requestPhoneSignup,
    });
};

export const usePhoneSignupVerify = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.verifyPhoneSignup,
        onSuccess: (data) => {
            tokenStorage.setToken(API_CONFIG.STORAGE.ACCESS_TOKEN, data.accessToken);
            if (data.refreshToken) {
                tokenStorage.setToken(API_CONFIG.STORAGE.REFRESH_TOKEN, data.refreshToken);
            }
            tokenStorage.setUser(data.user);
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
        },
    });
};

/**
 * Hook: Switch Organization
 */
export function useSwitchOrg() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (orgId: string) => authApi.switchOrg(orgId),
        onSuccess: (data: AuthResponse) => {
            // Update tokens and user session
            setAuthSession(data.accessToken, data.refreshToken, data.user);

            // Update cached user data
            queryClient.setQueryData(authKeys.user(), data.user);

            // Invalidate all queries to refresh data (projects, tasks, etc.)
            queryClient.invalidateQueries();

            // Force refresh to ensure all components pick up the new context
            router.refresh();
        },
    });
}
