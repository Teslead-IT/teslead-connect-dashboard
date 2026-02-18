'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-auth';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import {
    Users,
    Shield,
    CreditCard,
    Settings,
    Search,
    UserCircle,
    MoreVertical,
    Building2,
    X,
    AlertCircle,
    Crown,
    UserPlus,
    Activity,
    TrendingUp
} from 'lucide-react';
import { OrgRole } from '@/types/invitation';
import { Modal } from '@/components/ui/Modal';
import { useOrgPermissions, type OrgRole as PermissionOrgRole } from '@/lib/permissions';

const TABS: TabItem[] = [
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'overview', label: 'Overview', icon: <Building2 className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
];

export default function OrganizationSettingsPage() {
    const { data: user } = useUser();
    const orgId = user?.currentOrgId || user?.memberships?.[0]?.orgId;
    const orgName = user?.memberships?.find(m => m.orgId === orgId)?.orgName || 'Organization';
    const [activeTab, setActiveTab] = useState('members');
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

    const currentMembership = user?.memberships?.find(m => m.orgId === orgId);

    // Get organization context for permissions
    const org = useMemo(() => ({
        ownerId: currentMembership?.ownerId
    }), [currentMembership]);

    // Calculate permissions using centralized system
    const permissions = useOrgPermissions(
        user?.id,
        org,
        currentMembership?.role as PermissionOrgRole | undefined
    );

    // Role Change States
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<'select' | 'confirm'>('select');
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [newRole, setNewRole] = useState<OrgRole>(OrgRole.MEMBER);
    const [confirmationText, setConfirmationText] = useState('');

    const { members, isLoading, updateRole, updateRoleAsync, isUpdating } = useOrganizationMembers(orgId || '', searchQuery);

    const handleOpenRoleModal = (member: any) => {
        setSelectedMember(member);
        setNewRole(member.role as OrgRole);
        setConfirmationText('');
        setModalStep('select');
        setIsRoleModalOpen(true);
    };

    const handleConfirmRoleChange = async () => {
        if (orgId && selectedMember && confirmationText === selectedMember.email) {
            const toastId = toast.loading('Updating member role...');

            try {
                // Wait for both the API call and a minimum of 2 seconds
                await Promise.all([
                    updateRoleAsync({ userId: selectedMember.id, role: newRole }),
                    new Promise(resolve => setTimeout(resolve, 2000))
                ]);

                toast.success('Role Updated', 'Member role updated successfully', { id: toastId, soundEnabled: true });
                setIsRoleModalOpen(false);
            } catch (error: any) {
                toast.error('Update Failed', error?.response?.data?.message || error.message || 'Failed to update member role', { id: toastId, soundEnabled: true });
            }
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Settings</h1>
                </div>

                {/* Tabs & Search Row */}
                <div className="flex items-center justify-between gap-4 border-b border-gray-200">
                    <Tabs
                        items={TABS}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="border-b-0 -mb-[1px]"
                    />
                    <div className="relative w-full max-w-sm group mb-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#091590] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'members' ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                        {/* Members Table */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-height-[500px]">
                            <div className="overflow-x-auto overflow-y-auto flex-1 h-full">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="sticky top-0 z-10 bg-white">
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Member</th>
                                            <th className="px-8 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-8 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            {permissions.canUpdateMemberRole && (
                                                <th className="px-8 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-8 py-5"><div className="h-10 w-48 bg-gray-100 rounded-lg"></div></td>
                                                    <td className="px-8 py-5"><div className="h-6 w-20 bg-gray-100 rounded-full"></div></td>
                                                    <td className="px-8 py-5"><div className="h-6 w-16 bg-gray-100 rounded-full"></div></td>
                                                    {permissions.canUpdateMemberRole && (
                                                        <td className="px-8 py-5"><div className="h-8 w-8 bg-gray-100 rounded-lg float-right"></div></td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : members.length === 0 ? (
                                            <tr>
                                                <td colSpan={permissions.canUpdateMemberRole ? 4 : 3} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-4 bg-gray-50 rounded-full">
                                                            <Users className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-gray-900">No members found</p>
                                                            <p className="text-xs text-gray-500">Try adjusting your search filters</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            members.map((member: any) => (
                                                <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                src={member.avatarUrl}
                                                                name={member.name || member.email}
                                                                size="sm"
                                                                className="ring-2 ring-white shadow-sm"
                                                            />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#091590] transition-colors">
                                                                    {member.name || 'User'}
                                                                </span>
                                                                <span className="text-xs text-gray-500 truncate">
                                                                    {member.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <Badge
                                                            variant="info"
                                                            size="sm"
                                                            className={cn(
                                                                "text-[10px] uppercase font-bold tracking-wide shadow-sm border",
                                                                member.role === 'OWNER' && "bg-orange-50 text-orange-700 border-orange-200",
                                                                member.role === 'ADMIN' && "bg-purple-50 text-purple-700 border-purple-200",
                                                                member.role === 'MEMBER' && "bg-blue-50 text-[#091590] border-blue-200"
                                                            )}
                                                        >
                                                            {member.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                            </div>
                                                            <span className="text-xs font-medium text-green-700">Active</span>
                                                        </div>
                                                    </td>
                                                    {permissions.canUpdateMemberRole && (
                                                        <td className="px-8 py-5 text-right relative">
                                                            <Dropdown
                                                                className="w-48"
                                                                placeholder=""
                                                                onChange={(val) => {
                                                                    if (val === 'change-role') handleOpenRoleModal(member);
                                                                }}
                                                                options={[
                                                                    { label: 'Edit Member Role', value: 'change-role', icon: <Settings className="w-4 h-4" /> },
                                                                    { label: 'Remove Member', value: 'remove', icon: <X className="w-4 h-4 text-red-500" /> },
                                                                ]}
                                                                customTrigger={
                                                                    <button className="p-2 text-gray-400 hover:text-[#091590] hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                }
                                                            />
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            {members.length > 0 && (
                                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/30">
                                    <p className="text-xs text-gray-500">
                                        Showing <span className="font-semibold text-gray-700">{members.length}</span> member{members.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 text-[#091590] rounded-xl flex items-center justify-center">
                            {TABS.find(t => t.id === activeTab)?.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {TABS.find(t => t.id === activeTab)?.label} Settings
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                                This section is currently under development.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Role Change Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={modalStep === 'select' ? "Change Member Role" : "Confirm Role Change"}
                size="sm"
            >
                {selectedMember && (
                    <div className="space-y-5">
                        {/* Member Info */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <Avatar
                                src={selectedMember.avatarUrl}
                                name={selectedMember.name || selectedMember.email}
                                size="sm"
                                className="ring-2 ring-white shadow-sm"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{selectedMember.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{selectedMember.email}</p>
                            </div>
                        </div>

                        {modalStep === 'select' ? (
                            <div className="space-y-5">
                                <Dropdown
                                    label="New Role"
                                    className="w-full"
                                    value={newRole}
                                    onChange={(val) => setNewRole(val as OrgRole)}
                                    options={[
                                        { label: 'Owner', value: OrgRole.OWNER, icon: <Shield className="w-4 h-4" /> },
                                        { label: 'Admin', value: OrgRole.ADMIN, icon: <Settings className="w-4 h-4" /> },
                                        { label: 'Member', value: OrgRole.MEMBER, icon: <UserCircle className="w-4 h-4" /> },
                                    ]}
                                />
                                <p className="text-xs text-gray-500 -mt-2 ml-1">
                                    Selecting a new role will update permissions for this member.
                                </p>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => setIsRoleModalOpen(false)}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setModalStep('confirm')}
                                        className="flex-[2] px-4 py-2 rounded-lg bg-[#091590] text-sm font-semibold text-white hover:bg-[#071170] shadow-sm transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-900">Verification Required</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Type <span className="font-semibold">{selectedMember.email}</span> to confirm changing role to <span className="font-semibold uppercase">{newRole}</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={confirmationText}
                                        onChange={(e) => setConfirmationText(e.target.value)}
                                        placeholder="Type email to confirm..."
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => setModalStep('select')}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleConfirmRoleChange}
                                        disabled={confirmationText !== selectedMember.email || isUpdating}
                                        className={cn(
                                            "flex-[2] px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm flex items-center justify-center gap-2",
                                            confirmationText === selectedMember.email
                                                ? "bg-[#091590] hover:bg-[#071170]"
                                                : "bg-gray-300 cursor-not-allowed"
                                        )}
                                    >
                                        {isUpdating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        Update Role
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }
            </Modal >
            <ToastContainer />
        </div >
    );
}
