/**
 * Invitations Page - Example Implementation
 * Demonstrates complete invitation system usage
 */

'use client';

import React, { useState } from 'react';
import { SendInviteModal, PendingInvitesList } from '@/components/invitations';
import { NotificationBell } from '@/components/notifications';
import { Button } from '@/components/ui/Button';
import { useInvitations } from '@/hooks/use-invitations';

export default function InvitationsPage() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Example organization data (replace with actual data from your app)
    const currentOrg = {
        id: 'org_123',
        name: 'Acme Inc',
    };

    // Example projects (replace with actual data)
    const projects = [
        { id: 'proj_1', name: 'Website Redesign' },
        { id: 'proj_2', name: 'Mobile App' },
        { id: 'proj_3', name: 'Marketing Campaign' },
    ];

    // Get all invitation functionality
    const {
        pendingInvites,
        hasPendingInvites,
        pendingInvitesCount,
        isPendingLoading,
        refetchPending,
    } = useInvitations(currentOrg.id);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header with Notification Bell */}
            <header className="sticky top-0 z-50 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                Team Management
                            </h1>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                                Manage invitations and team members for {currentOrg.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <NotificationBell />

                            {/* Send Invite Button */}
                            <Button
                                variant="primary"
                                onClick={() => setIsInviteModalOpen(true)}
                            >
                                + Invite Member
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard
                        title="Pending Invitations"
                        value={pendingInvitesCount}
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                                />
                            </svg>
                        }
                        variant="blue"
                    />
                    <StatsCard
                        title="Active Members"
                        value={24}
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        }
                        variant="green"
                    />
                    <StatsCard
                        title="Total Projects"
                        value={projects.length}
                        icon={
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                        }
                        variant="purple"
                    />
                </div>

                {/* Pending Invitations Section */}
                <section className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Pending Invitations
                            </h2>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                                Invitations sent to your email that need your action
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetchPending()}
                            disabled={isPendingLoading}
                        >
                            <svg
                                className={`w-4 h-4 mr-2 ${isPendingLoading ? 'animate-spin' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Refresh
                        </Button>
                    </div>

                    <PendingInvitesList
                        onAccept={(invite) => {
                            console.log('Accepted invite:', invite);
                        }}
                        onReject={(invite) => {
                            console.log('Rejected invite:', invite);
                        }}
                    />
                </section>

                {/* Usage Instructions */}
                <section className="mt-8 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-6">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                        🚀 How to Use the Invitation System
                    </h2>

                    <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <p className="font-medium text-[var(--color-text-primary)] mb-1">
                                    Send Invitations
                                </p>
                                <p className="text-[var(--color-text-tertiary)]">
                                    Click "Invite Member" to send invitations to new team members with specific roles
                                    and optional project assignments.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <p className="font-medium text-[var(--color-text-primary)] mb-1">
                                    Real-time Notifications
                                </p>
                                <p className="text-[var(--color-text-tertiary)]">
                                    The notification bell shows real-time updates when you receive invitations or when
                                    your invitations are accepted/rejected.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                                3
                            </div>
                            <div>
                                <p className="font-medium text-[var(--color-text-primary)] mb-1">
                                    Accept or Reject
                                </p>
                                <p className="text-[var(--color-text-tertiary)]">
                                    Review pending invitations and accept to join the organization or reject if you're
                                    not interested. Invitations expire after 48 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Integration Example */}
                <section className="mt-8 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-6">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                        💻 Code Examples
                    </h2>

                    <div className="space-y-4">
                        <CodeBlock
                            title="Using the Invitation Hook"
                            code={`import { useInvitations } from '@/hooks/use-invitations';

function MyComponent() {
  const { 
    pendingInvites, 
    sendInvite, 
    acceptInvite 
  } = useInvitations('org_123');

  return (
    <div>
      {pendingInvites.map(invite => (
        <button onClick={() => acceptInvite(invite.inviteToken)}>
          Accept {invite.org.name}
        </button>
      ))}
    </div>
  );
}`}
                        />

                        <CodeBlock
                            title="Using the Notification Bell"
                            code={`import { NotificationBell } from '@/components/notifications';

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}`}
                        />
                    </div>
                </section>
            </main>

            {/* Send Invite Modal */}
            <SendInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                orgId={currentOrg.id}
                orgName={currentOrg.name}
            />
        </div>
    );
}

// ============= Helper Components =============

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    variant: 'blue' | 'green' | 'purple';
}

function StatsCard({ title, value, icon, variant }: StatsCardProps) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        purple: 'bg-purple-500/10 text-purple-500',
    };

    return (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${colors[variant]} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">{value}</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">{title}</p>
        </div>
    );
}

interface CodeBlockProps {
    title: string;
    code: string;
}

function CodeBlock({ title, code }: CodeBlockProps) {
    return (
        <div className="rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
            <div className="bg-[var(--color-bg-tertiary)] px-4 py-2 border-b border-[var(--color-border-primary)]">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">{title}</p>
            </div>
            <pre className="p-4 overflow-x-auto bg-[var(--color-bg-primary)]">
                <code className="text-xs text-[var(--color-text-secondary)] font-mono">{code}</code>
            </pre>
        </div>
    );
}
