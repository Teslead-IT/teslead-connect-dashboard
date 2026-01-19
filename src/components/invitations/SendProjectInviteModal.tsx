/**
 * Send Project Invite Modal Component
 * Slide-over panel for inviting users to a specific project via email
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Send, Mail, Shield, UserCog, Eye } from 'lucide-react';
import { useSendInvite } from '@/hooks/use-invitations';
import { useUser } from '@/hooks/use-auth';
import { OrgRole, ProjectRole } from '@/types/invitation';

interface SendProjectInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

export function SendProjectInviteModal({
    isOpen,
    onClose,
    projectId,
    projectName,
}: SendProjectInviteModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<ProjectRole>(ProjectRole.VIEWER);
    const { data: user } = useUser();

    // Get Org ID with robust fallback
    const orgId = user?.currentOrgId || user?.memberships?.[0]?.orgId || 'org_123';

    const { mutate: sendInvite, isPending, isSuccess, isError, error } = useSendInvite(orgId);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !orgId) return;

        sendInvite(
            {
                email,
                orgRole: OrgRole.MEMBER,
                id: projectId,
                projectRole: role,
            },
            {
                onSuccess: () => {
                    setEmail('');
                    setRole(ProjectRole.VIEWER); // Reset role
                    onClose();
                },
            }
        );
    };

    if (!isOpen) return null;

    const roles = [
        {
            id: ProjectRole.ADMIN,
            label: 'Admin',
            description: 'Full project control',
            icon: Shield,
            color: 'text-purple-600 bg-purple-50 border-purple-200'
        },
        {
            id: ProjectRole.MEMBER,
            label: 'Member',
            description: 'Can create/edit tasks',
            icon: UserCog, // Changed from Edit3 to UserCog for better semantic match, or stick to Edit3 if preferred
            color: 'text-blue-600 bg-blue-50 border-blue-200'
        },
        {
            id: ProjectRole.VIEWER,
            label: 'Viewer',
            description: 'Read-only access',
            icon: Eye,
            color: 'text-gray-600 bg-gray-50 border-gray-200'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Slide-over Panel */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Invite to Project</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Add members to <span className="font-medium text-gray-900">{projectName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all text-sm shadow-sm"
                                    placeholder="colleague@example.com"
                                    disabled={isPending}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Project Role</label>
                            <div className="grid gap-3">
                                {roles.map((r) => {
                                    const Icon = r.icon;
                                    const isSelected = role === r.id;
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => setRole(r.id)}
                                            className={cn(
                                                "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                                isSelected
                                                    ? `border-[#091590] bg-blue-50/30`
                                                    : "border-transparent bg-white hover:bg-white hover:border-gray-200 shadow-sm"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg mr-3", r.color)}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("text-sm font-semibold", isSelected ? "text-[#091590]" : "text-gray-900")}>
                                                        {r.label}
                                                    </p>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#091590]" />}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Success Message */}
                        {isSuccess && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-green-800">Invitation Sent!</h4>
                                    <p className="text-xs text-green-600 mt-0.5">The user has been invited successfully.</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {isError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <X className="w-3 h-3 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-red-800">Failed to send</h4>
                                    <p className="text-xs text-red-600 mt-0.5">
                                        {(error as any)?.response?.data?.message || (error as Error)?.message || 'Something went wrong.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !email}
                        className="px-6 py-2 text-sm font-medium text-white bg-[#091590] rounded-lg hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Send Invite
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
