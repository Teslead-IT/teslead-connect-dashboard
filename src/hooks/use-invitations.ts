/**
 * Invitation Hooks using TanStack Query
 * Provides clean, reusable hooks with optimized caching and refetching
 * 
 * Features:
 * - Automatic refetching on window focus
 * - Optimistic updates
 * - Cache invalidation strategies
 * - Loading and error states
 */

'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';
import { invitationsApi, getInviteErrorMessage } from '@/services/invitations.service';
import type {
    SendInviteDto,
    PendingInvite,
    AcceptInviteResponse,
    RejectInviteResponse,
    InviteResponse,
    ResendInviteResponse,
} from '@/types/invitation';

// ============= Query Keys for Cache Management =============

export const invitationKeys = {
    all: ['invitations'] as const,
    pending: () => [...invitationKeys.all, 'pending'] as const,
    byOrg: (orgId: string) => [...invitationKeys.all, 'org', orgId] as const,
} as const;

// ============= Query Hooks =============

/**
 * Hook: Get Pending Invitations
 * Fetches all pending invitations for the current user
 * 
 * Features:
 * - Refetch on window focus (user might have new invites)
 * - 30 second stale time (reduces unnecessary refetches)
 * - Automatic retry on failure
 * 
 * @returns Query result with pending invitations
 */
export function usePendingInvites(): UseQueryResult<PendingInvite[], Error> {
    return useQuery({
        queryKey: invitationKeys.pending(),
        queryFn: invitationsApi.getPendingInvites,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
}

// ============= Mutation Hooks =============

/**
 * Hook: Send Invitation
 * Send org invite with optional project assignment
 * 
 * Features:
 * - Invalidates pending invites cache on success
 * - Shows user-friendly error messages
 * 
 * @param orgId - Organization ID
 * @returns Mutation result
 */
export function useSendInvite(
    orgId: string
): UseMutationResult<InviteResponse, Error, SendInviteDto> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendInviteDto) => invitationsApi.sendInvite(orgId, data),
        onSuccess: () => {
            // Invalidate pending invites (recipient might already be logged in)
            queryClient.invalidateQueries({
                queryKey: invitationKeys.pending(),
            });

            // Invalidate org-specific cache if we had one
            queryClient.invalidateQueries({
                queryKey: invitationKeys.byOrg(orgId),
            });
        },
        onError: (error: any) => {
            const message = getInviteErrorMessage(
                error?.response?.status || 500,
                error?.response?.data?.message
            );
            console.error('Send invite error:', message);
        },
    });
}

/**
 * Hook: Accept Invitation
 * Accept a pending invitation and join organization/project
 * 
 * Features:
 * - Invalidates pending invites on success
 * - Refetches user data (new org membership)
 * - Can trigger navigation to new org/project
 * 
 * @returns Mutation result with org/project details
 */
export function useAcceptInvite(): UseMutationResult<
    AcceptInviteResponse,
    Error,
    string
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteToken: string) => invitationsApi.acceptInvite(inviteToken),
        onSuccess: (data) => {
            // Remove this invite from pending list (optimistic update)
            queryClient.setQueryData<PendingInvite[]>(
                invitationKeys.pending(),
                (old) => old?.filter((invite) => invite.org.id !== data.organization.id) || []
            );

            // Invalidate to refetch fresh data
            queryClient.invalidateQueries({
                queryKey: invitationKeys.pending(),
            });

            // Invalidate user data to reflect new organization membership
            queryClient.invalidateQueries({
                queryKey: ['auth', 'user'],
            });

            // Invalidate projects if project was assigned
            if (data.project) {
                queryClient.invalidateQueries({
                    queryKey: ['projects'],
                });
            }
        },
        onError: (error: any) => {
            const message = getInviteErrorMessage(
                error?.response?.status || 500,
                error?.response?.data?.message
            );
            console.error('Accept invite error:', message);
        },
    });
}

/**
 * Hook: Reject Invitation
 * Reject a pending invitation
 * 
 * Features:
 * - Removes invite from pending list immediately (optimistic)
 * - Invalidates cache on success
 * 
 * @returns Mutation result
 */
export function useRejectInvite(): UseMutationResult<
    RejectInviteResponse,
    Error,
    string
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteToken: string) => invitationsApi.rejectInvite(inviteToken),
        onMutate: async (inviteToken) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: invitationKeys.pending(),
            });

            // Snapshot previous value
            const previousInvites = queryClient.getQueryData<PendingInvite[]>(
                invitationKeys.pending()
            );

            // Optimistically remove the rejected invite
            queryClient.setQueryData<PendingInvite[]>(
                invitationKeys.pending(),
                (old) => old?.filter((invite) => invite.inviteToken !== inviteToken) || []
            );

            // Return rollback function
            return { previousInvites };
        },
        onError: (error, inviteToken, context) => {
            // Rollback on error
            if (context?.previousInvites) {
                queryClient.setQueryData(
                    invitationKeys.pending(),
                    context.previousInvites
                );
            }

            const message = getInviteErrorMessage(
                (error as any)?.response?.status || 500,
                (error as any)?.response?.data?.message
            );
            console.error('Reject invite error:', message);
        },
        onSuccess: () => {
            // Invalidate to ensure consistency
            queryClient.invalidateQueries({
                queryKey: invitationKeys.pending(),
            });
        },
    });
}

/**
 * Hook: Resend Invitation
 * Resend an invitation with new token and extended expiry
 * 
 * @param orgId - Organization ID
 * @returns Mutation result
 */
export function useResendInvite(
    orgId: string
): UseMutationResult<ResendInviteResponse, Error, string> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (email: string) => invitationsApi.resendInvite(orgId, email),
        onSuccess: () => {
            // Invalidate pending invites
            queryClient.invalidateQueries({
                queryKey: invitationKeys.pending(),
            });
        },
        onError: (error: any) => {
            const message = getInviteErrorMessage(
                error?.response?.status || 500,
                error?.response?.data?.message
            );
            console.error('Resend invite error:', message);
        },
    });
}

// ============= Combined Hook =============

/**
 * Combined Invitations Hook
 * All invitation operations in one convenient hook
 * 
 * @param orgId - Organization ID (optional, required for sending/resending)
 * @returns Object with all invitation operations and states
 */
export function useInvitations(orgId?: string) {
    const pendingQuery = usePendingInvites();
    const acceptMutation = useAcceptInvite();
    const rejectMutation = useRejectInvite();

    // Only create send/resend hooks if orgId is provided
    const sendMutation = orgId ? useSendInvite(orgId) : null;
    const resendMutation = orgId ? useResendInvite(orgId) : null;

    return {
        // Pending invites data
        pendingInvites: pendingQuery.data || [],
        hasPendingInvites: (pendingQuery.data?.length || 0) > 0,
        pendingInvitesCount: pendingQuery.data?.length || 0,

        // Query states
        isPendingLoading: pendingQuery.isLoading,
        isPendingError: pendingQuery.isError,
        pendingError: pendingQuery.error,

        // Mutation actions
        sendInvite: sendMutation?.mutate,
        acceptInvite: acceptMutation.mutate,
        rejectInvite: rejectMutation.mutate,
        resendInvite: resendMutation?.mutate,

        // Mutation states
        isSending: sendMutation?.isPending || false,
        isAccepting: acceptMutation.isPending,
        isRejecting: rejectMutation.isPending,
        isResending: resendMutation?.isPending || false,

        // Errors
        sendError: sendMutation?.error,
        acceptError: acceptMutation.error,
        rejectError: rejectMutation.error,
        resendError: resendMutation?.error,

        // Refetch function
        refetchPending: pendingQuery.refetch,
    };
}
