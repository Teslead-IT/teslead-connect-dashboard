/**
 * Edit Project Members Modal
 * Manage already-allowed project members: change role or remove
 */

'use client';

import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { Dropdown } from '@/components/ui/Dropdown';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import {
    useProjectMembers,
    useUpdateProjectMemberRole,
    useRemoveProjectMember,
} from '@/hooks/use-projects';
import { useUser } from '@/hooks/use-auth';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { Settings, Trash2, Shield, UserCog, Eye } from 'lucide-react';
import type { ProjectMember } from '@/types/project';

interface EditProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    projectOwnerId?: string | null;
}

type AssignableRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

const ROLE_OPTIONS = [
    { label: 'Admin', value: 'ADMIN', icon: <Shield className="w-4 h-4" /> },
    { label: 'Member', value: 'MEMBER', icon: <UserCog className="w-4 h-4" /> },
    { label: 'Viewer', value: 'VIEWER', icon: <Eye className="w-4 h-4" /> },
];

const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    MEMBER: 'bg-blue-50 text-blue-700 border-blue-200',
    VIEWER: 'bg-gray-50 text-gray-700 border-gray-200',
    OWNER: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function EditProjectMembersModal({
    isOpen,
    onClose,
    projectId,
    projectName,
    projectOwnerId,
}: EditProjectMembersModalProps) {
    const toast = useToast();
    const { data: user } = useUser();
    const { data: members = [], isLoading } = useProjectMembers(isOpen ? projectId : '');
    const updateRoleMutation = useUpdateProjectMemberRole(projectId);
    const removeMemberMutation = useRemoveProjectMember(projectId);

    const [roleTarget, setRoleTarget] = useState<ProjectMember | null>(null);
    const [newRole, setNewRole] = useState<AssignableRole>('MEMBER');
    const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);

    const sortedMembers = useMemo(() => {
        return [...members].sort((a, b) => {
            if (a.userId === projectOwnerId) return -1;
            if (b.userId === projectOwnerId) return 1;
            return (a.user.name || '').localeCompare(b.user.name || '');
        });
    }, [members, projectOwnerId]);

    const canManageMember = (member: ProjectMember) => {
        if (!user?.id) return false;
        if (member.userId === user.id) return false;
        if (member.userId === projectOwnerId) return false;
        return true;
    };

    const handleOpenRoleChange = (member: ProjectMember) => {
        const current = (member.role === 'ADMIN' || member.role === 'MEMBER' || member.role === 'VIEWER')
            ? member.role
            : 'MEMBER';
        setNewRole(current);
        setRoleTarget(member);
    };

    const handleConfirmRoleChange = async () => {
        if (!roleTarget) return;
        if (roleTarget.role === newRole) {
            setRoleTarget(null);
            return;
        }

        const toastId = toast.loading('Updating member role...');
        try {
            await updateRoleMutation.mutateAsync({
                userId: roleTarget.userId,
                role: newRole,
            });
            toast.success('Role updated', undefined, { id: toastId, soundEnabled: true });
            setRoleTarget(null);
        } catch (error: any) {
            toast.error(
                'Failed to update role',
                error?.response?.data?.message || error?.message || 'Unknown error',
                { id: toastId, soundEnabled: true }
            );
        }
    };

    const handleConfirmRemove = async () => {
        if (!removeTarget) return;

        const toastId = toast.loading('Removing member...');
        try {
            await removeMemberMutation.mutateAsync(removeTarget.userId);
            toast.success('Member removed', undefined, { id: toastId, soundEnabled: true });
            setRemoveTarget(null);
        } catch (error: any) {
            toast.error(
                'Failed to remove member',
                error?.response?.data?.message || error?.message || 'Unknown error',
                { id: toastId, soundEnabled: true }
            );
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Edit Members"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Manage roles or remove members already allowed on{' '}
                        <span className="font-semibold text-gray-800">{projectName}</span>.
                        Use Invite to add new people.
                    </p>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader />
                        </div>
                    ) : sortedMembers.length === 0 ? (
                        <div className="text-center py-12 text-xs text-gray-500">
                            No members found on this project.
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-3 py-2">Member</th>
                                        <th className="px-3 py-2 w-28">Role</th>
                                        <th className="px-3 py-2 w-36 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedMembers.map((member) => {
                                        const manageable = canManageMember(member);
                                        const isOwner = member.userId === projectOwnerId;
                                        const displayRole = isOwner ? 'OWNER' : member.role;

                                        return (
                                            <tr key={member.id} className="hover:bg-gray-50/80">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                                            style={{ backgroundColor: getAvatarColor(member.user.name || member.user.email) }}
                                                        >
                                                            {member.user.avatarUrl ? (
                                                                <img
                                                                    src={member.user.avatarUrl}
                                                                    alt=""
                                                                    className="w-full h-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                getInitials(member.user.name || member.user.email)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                                {member.user.name || 'User'}
                                                                {member.userId === user?.id && (
                                                                    <span className="ml-1 text-[10px] font-medium text-gray-400">(You)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500 truncate">{member.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase',
                                                        ROLE_BADGE[displayRole] || ROLE_BADGE.VIEWER
                                                    )}>
                                                        {displayRole}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {manageable ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenRoleChange(member)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-[#091590] hover:bg-blue-50 rounded-md transition-colors"
                                                                title="Change role"
                                                            >
                                                                <Settings className="w-3.5 h-3.5" />
                                                                Role
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRemoveTarget(member)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                title="Remove member"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-gray-400 text-right">
                                                            {isOwner ? 'Project owner' : member.userId === user?.id ? 'Yourself' : '—'}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={!!roleTarget}
                onClose={() => setRoleTarget(null)}
                title="Change Member Role"
                size="sm"
            >
                {roleTarget && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: getAvatarColor(roleTarget.user.name || roleTarget.user.email) }}
                            >
                                {getInitials(roleTarget.user.name || roleTarget.user.email)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{roleTarget.user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{roleTarget.user.email}</p>
                            </div>
                        </div>

                        <Dropdown
                            label="New Role"
                            className="w-full"
                            value={newRole}
                            onChange={(val) => setNewRole(val as AssignableRole)}
                            options={ROLE_OPTIONS}
                        />

                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setRoleTarget(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRoleChange}
                                disabled={updateRoleMutation.isPending || roleTarget.role === newRole}
                                className="flex-[2] px-4 py-2 rounded-lg bg-[#091590] text-xs font-semibold text-white hover:bg-[#071170] shadow-sm transition-colors disabled:opacity-50"
                            >
                                {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Dialog
                isOpen={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                type="warning"
                title="Remove Member"
                message={`Remove "${removeTarget?.user.name || removeTarget?.user.email}" from this project? They will lose project access.`}
                confirmText="Remove Member"
                confirmVariant="destructive"
                onConfirm={handleConfirmRemove}
                isLoading={removeMemberMutation.isPending}
            />
        </>
    );
}
