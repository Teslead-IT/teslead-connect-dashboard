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
import { useOrgStore, type OrgRole } from '@/stores/orgStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimerStore } from '@/stores/timerStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { disconnectPresenceSocket } from '@/lib/presence-socket';
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
 * Hook: Get Current User (Identity Only)
 * Fetches user data from backend. Not persisted to localStorage (tokens only).
 * Returns identity only—no attendance, presence, session, or other runtime state.
 * Role/org derive from memberships + activeOrgId in Zustand.
 */
export function useUser() {
    return useQuery({
        queryKey: authKeys.user(),
        queryFn: async () => {
            const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
            if (!token) return null; // No token, no user (prevents redirect loops)

            try {
                const data = await authApi.getMe();
                // Do NOT persist user to localStorage — tokens only. Role/org from Zustand + fresh /auth/me.
                return data.user || null;
            } catch (error) {
                console.error('Failed to fetch user:', error);
                return null;
            }
        },
        staleTime: 0, // Always revalidate so role changes (e.g. downgrade) are reflected on refresh
        refetchOnWindowFocus: true, // Re-fetch when user returns to tab
        gcTime: 30 * 60 * 1000, // 30 minutes
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

            router.push('/organization');

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
        mutationFn: async () => {
            queryClient.setQueryData(authKeys.user(), null);
            clearAuthTokens();
            useOrgStore.getState().clearOrg();
            return authApi.logout();
        },
        onSuccess: () => {
            queryClient.clear();
            if (typeof window !== 'undefined') {
                window.location.href = '/api/auth/logout';
            }
        },
        onError: () => {
            queryClient.clear();
            useOrgStore.getState().clearOrg();
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
            queryClient.setQueryData(authKeys.user(), data.user);
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
        },
    });
};

/** Minimum time (ms) to show switching overlay so the animation is visible and UI can update */
const SWITCH_OVERLAY_MIN_MS = 600;

/**
 * Hook: Switch Organization (Model A)
 * Caller (org page or TopNav) sets store + optionally navigates; this syncs with backend.
 * Keeps overlay visible for at least SWITCH_OVERLAY_MIN_MS for a smooth transition.
 */
export function useSwitchOrg() {
    const queryClient = useQueryClient();

    const clearOverlayAfterDelay = () => {
        setTimeout(() => {
            useOrgStore.getState().setSwitching(false);
        }, SWITCH_OVERLAY_MIN_MS);
    };

    return useMutation({
        mutationFn: async (orgId: string) => {
            return authApi.switchOrg(orgId);
        },
        onSuccess: (data: AuthResponse, orgId: string) => {
            setAuthSession(data.accessToken, data.refreshToken, data.user);
            queryClient.setQueryData(authKeys.user(), data.user);
            const role = data.user.memberships?.find((m) => m.orgId === orgId)?.role?.toUpperCase?.() as OrgRole | undefined;
            if (role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER') {
                useOrgStore.getState().setOrg(orgId, role);
            }
            useProjectStore.getState().clearProject();
            useTimerStore.getState().clearTimer();
            useAttendanceStore.getState().clearAttendance();
            usePresenceStore.getState().clearPresence();
            disconnectPresenceSocket();
            queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
            queryClient.invalidateQueries({ queryKey: ['org-settings'] });
            clearOverlayAfterDelay();
        },
        onError: () => {
            clearOverlayAfterDelay();
        },
    });
}

/**
 * Hook: Get all organizations for current user
 */
export function useAllOrgs() {
    return useQuery({
        queryKey: [...authKeys.all, 'organizations'],
        queryFn: () => authApi.getAllOrgs(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
