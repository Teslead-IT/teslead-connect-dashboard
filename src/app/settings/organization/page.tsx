'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-auth';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
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

    const { members, isLoading, updateRole, isUpdating } = useOrganizationMembers(orgId || '', searchQuery);

    const handleOpenRoleModal = (member: any) => {
        setSelectedMember(member);
        setNewRole(member.role as OrgRole);
        setConfirmationText('');
        setModalStep('select');
        setIsRoleModalOpen(true);
    };

    const handleConfirmRoleChange = () => {
        if (orgId && selectedMember && confirmationText === selectedMember.email) {
            updateRole({ userId: selectedMember.id, role: newRole }, {
                onSuccess: () => {
                    setIsRoleModalOpen(false);
                }
            });
        }
    };

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center justify-between gap-4 px-6 pt-4 border-b border-gray-100 bg-gray-50/50">
                    <Tabs
                        items={TABS}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="border-b-0 -mb-px"
                    />
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#091590] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#091590]/20 focus:border-[#091590] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'members' ? (
                        <div className="space-y-4">


                            {/* Members Table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                {permissions.canUpdateMemberRole && (
                                                    <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {isLoading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-4"><div className="h-10 w-48 bg-gray-100 rounded-lg"></div></td>
                                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full"></div></td>
                                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full"></div></td>
                                                        {permissions.canUpdateMemberRole && (
                                                            <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded-lg float-right"></div></td>
                                                        )}
                                                    </tr>
                                                ))
                                            ) : members.length === 0 ? (
                                                <tr>
                                                    <td colSpan={permissions.canUpdateMemberRole ? 4 : 3} className="px-6 py-16 text-center">
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
                                                        <td className="px-6 py-4">
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
                                                        <td className="px-6 py-4">
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
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                </div>
                                                                <span className="text-xs font-medium text-green-700">Active</span>
                                                            </div>
                                                        </td>
                                                        {permissions.canUpdateMemberRole && (
                                                            <td className="px-6 py-4 text-right relative">
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
                            </div>

                            {/* Footer */}
                            {members.length > 0 && (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-gray-500">
                                        Showing <span className="font-semibold text-gray-700">{members.length}</span> member{members.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
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
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-700">New Role</label>
                                    <Dropdown
                                        className="w-full"
                                        value={newRole}
                                        onChange={(val) => setNewRole(val as OrgRole)}
                                        options={[
                                            { label: 'Owner', value: OrgRole.OWNER, icon: <Shield className="w-4 h-4" /> },
                                            { label: 'Admin', value: OrgRole.ADMIN, icon: <Settings className="w-4 h-4" /> },
                                            { label: 'Member', value: OrgRole.MEMBER, icon: <UserCircle className="w-4 h-4" /> },
                                        ]}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Selecting a new role will update permissions for this member.
                                    </p>
                                </div>

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
                )}
            </Modal>
        </>
    );
}
