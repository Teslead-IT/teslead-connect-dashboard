import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useSwitchOrg } from '@/hooks/use-auth';
import { useTimerStore } from '@/stores/timerStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useOrgSwitchStore } from '@/stores/orgSwitchStore';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useOrgStore } from '@/stores/orgStore';
import { useProjectStore } from '@/stores/projectStore';
import { useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/hooks/use-auth';
import { Search, HelpCircle, Building2, UserPlus, ChevronDown, Check, Utensils, Coffee, Home, Moon, Clock } from 'lucide-react';
import { usePresenceStore } from '@/stores/presenceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications';
import { SendInviteModal } from '@/components/invitations';
import { AppsMenu } from './AppsMenu';
import { GlobalTimerNav } from './GlobalTimerNav';
import { AttendanceStatusMenu } from './AttendanceStatusMenu';
import { useOrgPermissions, type OrgRole } from '@/lib/permissions';

export function TopNav() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: backendUser, isLoading } = useUser();
    const { user: auth0User } = useAuth0User();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setOrg = useOrgStore((s) => s.setOrg);
    const setSwitching = useOrgStore((s) => s.setSwitching);
    const clearProject = useProjectStore((s) => s.clearProject);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
    const orgDropdownRef = useRef<HTMLDivElement>(null);
    const { mutate: switchOrg, isPending: isSwitchingOrg } = useSwitchOrg();
    const isTimerRunning = useTimerStore((s) => s.isRunning);
    const activeTimer = useTimerStore((s) => s.activeTimer);
    const setPendingOrgSwitch = useOrgSwitchStore((s) => s.setPending);
    const { isCollapsed } = useSidebar();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
                setOrgDropdownOpen(false);
            }
        };
        if (orgDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [orgDropdownOpen]);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const displayName = backendUser?.name || auth0User?.name || backendUser?.username || backendUser?.email?.split('@')[0] || auth0User?.nickname || 'User';
    const displayAvatar = backendUser?.avatarUrl || auth0User?.picture;
    const currentMembership = backendUser?.memberships?.find(m => m.orgId === activeOrgId);
    const orgName = currentMembership?.orgName;
    const email = backendUser?.email;
    const activeOrgRole = useOrgStore((s) => s.activeOrgRole);
    const userRole = (activeOrgRole ?? currentMembership?.role) as OrgRole | undefined;

    // Get organization context for permissions
    const org = useMemo(() => {
        return { ownerId: currentMembership?.ownerId };
    }, [currentMembership]);

    // Calculate permissions using centralized system (store role preferred)
    const permissions = useOrgPermissions(backendUser?.id, org, userRole);

    // Get current user presence & attendance
    const attendanceStatus = useAttendanceStore((s) => s.status);
    const userPresence = usePresenceStore((s) => backendUser?.id ? s.presences[backendUser.id] : null);
    
    // Priority: Attendance status (local source of truth) > Presence status (WS source for others)
    const activeStatus = (attendanceStatus && attendanceStatus !== 'not_checked_in' && attendanceStatus !== 'checked_out')
        ? attendanceStatus
        : (userPresence?.status || attendanceStatus || 'OFFLINE');

    const getPresenceConfig = (status: string) => {
        const s = status?.toString()?.toLowerCase();
        switch (s) {
            case 'online':
            case 'checked_in':
                return { color: 'bg-green-500', icon: <Check className="w-[7px] h-[7px] text-white" strokeWidth={4} /> };
            case 'lunch':
            case 'on_lunch':
                return { color: 'bg-amber-500', icon: <Utensils className="w-[7px] h-[7px] text-white" strokeWidth={3} /> };
            case 'break':
            case 'on_break':
                return { color: 'bg-amber-500', icon: <Coffee className="w-[7px] h-[7px] text-white" strokeWidth={3} /> };
            case 'wfh':
                return { color: 'bg-blue-500', icon: <Home className="w-[7px] h-[7px] text-white" strokeWidth={3} /> };
            case 'offline':
            case 'checked_out':
            case 'not_checked_in':
                return { color: 'bg-gray-400', icon: <Moon className="w-[7px] h-[7px] text-white" strokeWidth={3} /> };
            default:
                return { color: 'bg-gray-400', icon: null };
        }
    };

    const presenceConfig = getPresenceConfig(activeStatus);

    return (
        <motion.header
            initial={false}
            animate={{ left: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30"
        >
            <div className="h-full px-6 flex items-center justify-between gap-6">
                {/* Search Bar & Sticky Title */}
                <div className="flex-1 flex items-center gap-4 group">
                    <div className="relative w-30 transition-all duration-300 focus-within:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#091590] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#091590]/20 focus:border-[#091590] placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {isScrolled && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="hidden md:flex items-center gap-2 border-l border-gray-100 pl-4"
                            >
                                <h1 className="text-[13px] font-semibold text-gray-900">
                                    Welcome, {displayName.split(' ')[0]}
                                </h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Actions - Professional & Balanced */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                        {/* Org Switcher (updates activeOrgId, clears cache, resets app — not a filter) */}
                        {backendUser?.memberships && backendUser.memberships.length > 0 && (
                            <div className="relative hidden xl:block" ref={orgDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setOrgDropdownOpen((o) => !o)}
                                    disabled={isSwitchingOrg}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/50 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-100 rounded-full transition-all group/org min-w-0',
                                        isSwitchingOrg && 'opacity-70 pointer-events-none'
                                    )}
                                    title="Switch organization"
                                >
                                    <Building2 className="w-3.5 h-3.5 text-gray-400 group-hover/org:text-[#091590] transition-colors shrink-0" />
                                    <div className="flex flex-col items-start text-left min-w-0">
                                        <span className="text-[10px] font-bold text-gray-500 group-hover/org:text-[#091590] uppercase tracking-tight truncate max-w-[120px]">{orgName || 'Organization'}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{email}</span>
                                    </div>
                                    <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform', orgDropdownOpen && 'rotate-180')} />
                                </button>
                                <AnimatePresence>
                                    {orgDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full left-0 mt-1.5 py-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                                        >
                                            <div className="px-3 py-2 border-b border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch organization</p>
                                            </div>
                                            {backendUser.memberships
                                                .filter((m) => m.status === 'ACTIVE')
                                                .map((m) => {
                                                    const isActive = m.orgId === activeOrgId;
                                                    return (
                                                        <button
                                                            key={m.orgId}
                                                            type="button"
                                                            onClick={() => {
                                                                if (m.orgId === activeOrgId) {
                                                                    setOrgDropdownOpen(false);
                                                                    return;
                                                                }
                                                                setOrgDropdownOpen(false);
                                                                const role = m.role?.toUpperCase?.();
                                                                const validRole = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER' ? role : undefined;
                                                                const timerHasTask = activeTimer?.taskId != null;
                                                                if (isTimerRunning && !timerHasTask) {
                                                                    setPendingOrgSwitch(m.orgId, validRole);
                                                                    return;
                                                                }
                                                                setOrg(m.orgId, validRole);
                                                                clearProject();
                                                                queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
                                                                setSwitching(true);
                                                                router.replace('/dashboard');
                                                                switchOrg(m.orgId);
                                                            }}
                                                            className={cn(
                                                                'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                                                                isActive ? 'bg-blue-50/80 text-[#091590] font-medium' : 'hover:bg-gray-50 text-gray-700'
                                                            )}
                                                        >
                                                            {isActive ? <Check className="w-4 h-4 shrink-0 text-[#091590]" /> : <span className="w-4 shrink-0" />}
                                                            <span className="truncate">{m.orgName || m.slug || m.orgId}</span>
                                                            <span className="text-[10px] text-gray-400 uppercase ml-auto shrink-0">{m.role}</span>
                                                        </button>
                                                    );
                                                })}
                                            <Link
                                                href="/settings/organization"
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                                                onClick={() => setOrgDropdownOpen(false)}
                                            >
                                                <Building2 className="w-4 h-4" />
                                                Manage organizations
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        <AttendanceStatusMenu />
                    </div>

                    {/* Action Group */}
                    <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
                        {/* 👥 Invite Button - Only for Org Creators */}
                        {permissions.canInviteToOrg && (
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="p-2 text-gray-400 hover:text-[#091590] hover:bg-blue-50 rounded-lg transition-all active:scale-95 group"
                                title="Invite Members"
                            >
                                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform cursor-pointer" />
                            </button>
                        )}

                        <button
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all active:scale-95 cursor-pointer"
                            title="Help Center"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        <GlobalTimerNav />
                        {/* 🔔 Real-time Notification Bell with WebSocket */}
                        <NotificationBell />
                    </div>

                    {/* Apps Menu */}
                    <div className="pl-1">
                        <AppsMenu />
                    </div>

                    {/* User Profile - Premium Look */}
                    <Link href="/settings/account" className="flex items-center gap-2.5 pl-1 group hover:bg-gray-50 p-1.5 rounded-xl transition-all">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-900 group-hover:text-[#091590] transition-colors whitespace-nowrap">
                                {displayName}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                                {isLoading ? (
                                    <span className="animate-pulse bg-gray-200 h-3 w-12 block rounded" />
                                ) : (
                                    userRole || 'Owner'
                                )}
                            </span>
                        </div>
                        <div className="relative">
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-blue-50 transition-all shadow-sm"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#091590] to-[#071170] flex items-center justify-center text-white font-black text-xs shadow-inner uppercase">
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            {/* Online status indicator */}
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full shadow-sm flex items-center justify-center transition-colors duration-300",
                                presenceConfig.color
                            )}>
                                {presenceConfig.icon}
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Invite Modal */}
            <SendInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                orgId={activeOrgId || ''}
                orgName={orgName || 'Organization'}
            />
        </motion.header>
    );
}
