/**
 * Pending Invites List Component
 * Displays all pending invitations with accept/reject actions
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAcceptInvite, useRejectInvite, usePendingInvites } from '@/hooks/use-invitations';
import type { PendingInvite } from '@/types/invitation';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitesListProps {
    /** Show compact view (for dropdown/notification panel) */
    compact?: boolean;
    /** Limit number of items shown */
    limit?: number;
    /** Callback when invite is accepted */
    onAccept?: (invite: PendingInvite) => void;
    /** Callback when invite is rejected */
    onReject?: (invite: PendingInvite) => void;
}

export function PendingInvitesList({
    compact = false,
    limit,
    onAccept,
    onReject,
}: PendingInvitesListProps) {
    const router = useRouter();
    const { data: invites = [], isLoading, isError } = usePendingInvites();
    const { mutate: acceptInvite, isPending: isAccepting } = useAcceptInvite();
    const { mutate: rejectInvite, isPending: isRejecting } = useRejectInvite();

    const handleAccept = (invite: PendingInvite) => {
        acceptInvite(invite.inviteToken, {
            onSuccess: (data) => {
                // Navigate to the organization
                router.push(`/dashboard?org=${data.organization.id}`);
                onAccept?.(invite);
            },
        });
    };

    const handleReject = (invite: PendingInvite) => {
        rejectInvite(invite.inviteToken, {
            onSuccess: () => {
                onReject?.(invite);
            },
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span className="text-sm">Loading invitations...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to load invitations. Please try again.
                </p>
            </div>
        );
    }

    // Empty state
    if (invites.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full mb-4">
                    <svg
                        className="w-8 h-8 text-[var(--color-text-tertiary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                        />
                    </svg>
                </div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    No pending invitations
                </h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                    You're all caught up!
                </p>
            </div>
        );
    }

    const displayedInvites = limit ? invites.slice(0, limit) : invites;

    return (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {displayedInvites.map((invite) => (
                <InviteCard
                    key={invite.id}
                    invite={invite}
                    compact={compact}
                    onAccept={() => handleAccept(invite)}
                    onReject={() => handleReject(invite)}
                    isProcessing={isAccepting || isRejecting}
                />
            ))}

            {limit && invites.length > limit && (
                <div className="pt-2 text-center">
                    <button
                        onClick={() => router.push('/invitations')}
                        className="text-sm text-[var(--color-brand-primary)] hover:underline"
                    >
                        View all {invites.length} invitations
                    </button>
                </div>
            )}
        </div>
    );
}

// ============= Invite Card Component =============

interface InviteCardProps {
    invite: PendingInvite;
    compact: boolean;
    onAccept: () => void;
    onReject: () => void;
    isProcessing: boolean;
}

function InviteCard({ invite, compact, onAccept, onReject, isProcessing }: InviteCardProps) {
    const isExpired = new Date(invite.expiresAt) < new Date();

    return (
        <div
            className={`
        bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg
        hover:border-[var(--color-brand-primary)] transition-all duration-200
        ${compact ? 'p-3' : 'p-4'}
        ${isExpired ? 'opacity-60' : ''}
      `}
        >
            <div className="flex items-start justify-between gap-3">
                {/* Left: Organization Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[var(--color-text-primary)] truncate">
                            {invite.org.name}
                        </h4>
                        <Badge variant="info" size="sm">
                            {invite.role}
                        </Badge>
                    </div>

                    <p className="text-sm text-[var(--color-text-tertiary)] mb-2">
                        {invite.email}
                    </p>

                    {invite.project && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                            <span>Project: {invite.project.name}</span>
                        </div>
                    )}

                    {!compact && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>
                                {isExpired
                                    ? 'Expired'
                                    : `Expires ${formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                {!isExpired && (
                    <div className={`flex ${compact ? 'flex-col gap-1.5' : 'gap-2'}`}>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAccept();
                            }}
                            disabled={isProcessing}
                            className={compact ? 'text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}
                        >
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReject();
                            }}
                            disabled={isProcessing}
                            className={compact ? 'text-xs px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50' : 'bg-white border border-gray-200 hover:bg-gray-50'}
                        >
                            Reject
                        </Button>
                    </div>
                )}

                {isExpired && (
                    <Badge variant="danger" size="sm">
                        Expired
                    </Badge>
                )}
            </div>
        </div>
    );
}
