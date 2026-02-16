/**
 * Invitations API Service
 * All invitation-related API calls are centralized here
 * Provides clean separation of concerns and easy testing
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type {
    SendInviteDto,
    AcceptInviteDto,
    RejectInviteDto,
    ResendInviteDto,
    InviteResponse,
    PendingInvite,
    AcceptInviteResponse,
    RejectInviteResponse,
    ResendInviteResponse,
    UserSearchResponse,
} from '@/types/invitation';

/**
 * Invitation API endpoints configuration
 */
const INVITE_ENDPOINTS = {
    SEND: (orgId: string) => `/invites/send/${orgId}`,
    PENDING: '/invites/pending',
    ACCEPT: '/invites/accept',
    REJECT: '/invites/reject',
    RESEND: (orgId: string) => `/invites/resend/${orgId}`,
    SEARCH_USERS: '/invites/users',
    UPDATE_MEMBER_ROLE: (orgId: string, userId: string) => `/organizations/${orgId}/members/${userId}`,
} as const;

export const invitationsApi = {
    /**
     * Send organization invitation
     * Can optionally include project assignment
     * 
     * @requires RBAC: ADMIN or OWNER role
     * @param orgId - Organization ID
     * @param data - Invitation details (email, orgRole, optional projectId/projectRole)
     * @returns Invitation response with expiry time
     */
    async sendInvite(
        orgId: string,
        data: SendInviteDto
    ): Promise<InviteResponse> {
        const { data: response } = await apiClient.post<InviteResponse>(
            INVITE_ENDPOINTS.SEND(orgId),
            data
        );
        return response;
    },

    /**
     * Get all pending invitations for current user
     * Shows invites where user's email matches
     * 
     * @returns Array of pending invitations
     */
    async getPendingInvites(): Promise<PendingInvite[]> {
        const { data } = await apiClient.get<PendingInvite[]>(
            INVITE_ENDPOINTS.PENDING
        );
        return data;
    },

    /**
     * Accept an invitation
     * Joins organization and optionally assigned project
     * 
     * @param inviteToken - Unique token from invitation
     * @returns Organization and optional project details
     * @throws 404 - Invalid token
     * @throws 400 - Expired invitation
     * @throws 403 - Email mismatch
     */
    async acceptInvite(
        inviteToken: string
    ): Promise<AcceptInviteResponse> {
        const { data } = await apiClient.post<AcceptInviteResponse>(
            INVITE_ENDPOINTS.ACCEPT,
            { inviteToken }
        );
        return data;
    },

    /**
     * Reject an invitation
     * Marks invitation as rejected
     * 
     * @param inviteToken - Unique token from invitation
     * @returns Rejection confirmation
     */
    async rejectInvite(
        inviteToken: string
    ): Promise<RejectInviteResponse> {
        const { data } = await apiClient.post<RejectInviteResponse>(
            INVITE_ENDPOINTS.REJECT,
            { inviteToken }
        );
        return data;
    },

    /**
     * Resend invitation to user
     * Generates new token and extends expiry
     * 
     * @requires RBAC: ADMIN or OWNER role
     * @param orgId - Organization ID
     * @param email - Email to resend to
     * @returns New invitation details
     */
    async resendInvite(
        orgId: string,
        email: string
    ): Promise<ResendInviteResponse> {
        const { data } = await apiClient.post<ResendInviteResponse>(
            INVITE_ENDPOINTS.RESEND(orgId),
            { email }
        );
        return data;
    },

    /**
     * Search users for invitation
     * 
     * @param params - Search parameters (query, limit, page, projectId)
     * @returns List of users matching query
     */
    async searchUsers(params: {
        query: string;
        limit?: number;
        page?: number;
        projectId?: string;
        orgId?: string;
    }): Promise<UserSearchResponse> {
        const { data } = await apiClient.get<UserSearchResponse>(
            INVITE_ENDPOINTS.SEARCH_USERS,
            { params: { ...params, orgId: params.orgId } }
        );
        return data;
    },

    /**
     * Update organization member role
     * 
     * @param orgId - Organization ID
     * @param userId - User ID to update
     * @param role - New role (OWNER, ADMIN, MEMBER)
     */
    async updateMemberRole(
        orgId: string,
        userId: string,
        role: string
    ): Promise<{ message: string }> {
        const { data } = await apiClient.patch(
            INVITE_ENDPOINTS.UPDATE_MEMBER_ROLE(orgId, userId),
            { role }
        );
        return data;
    },
};

/**
 * Error handling helper for invitation operations
 * Provides user-friendly error messages
 */
export function getInviteErrorMessage(statusCode: number, message?: string): string {
    switch (statusCode) {
        case 400:
            return message || 'Invalid request. Please check your input.';
        case 403:
            return 'You don\'t have permission to perform this action.';
        case 404:
            return 'Invitation not found or has expired.';
        case 409:
            return 'This user has already been invited.';
        default:
            return message || 'An error occurred. Please try again.';
    }
}
