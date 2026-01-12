// Type definitions for Authentication
export interface Membership {
    orgId: string;
    orgName: string;
    slug: string;
    role: string;
}

export interface User {
    id: string;
    email: string;
    username?: string;
    name?: string | null;  // Aligned with backend response
    phone?: string;
    avatarUrl?: string | null;
    fullName?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; // Backend might return this or memberships
    accountStatus: 'ACTIVE' | 'UNVERIFIED' | 'SUSPENDED' | 'DEACTIVATED';
    emailVerified?: boolean;
    currentOrgId?: string;
    memberships?: Membership[];
    organizationId?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
}

export interface LoginCredentials {
    identifier: string; // email, username, or phone
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    name?: string;

    phone?: string;
}

export interface VerifyEmailPayload {
    email: string;
    otp: string;
}

export interface ResetPasswordPayload {
    email: string;
    otp: string;
    newPassword: string;
}

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
}
