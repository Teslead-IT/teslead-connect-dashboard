import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-auth';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { Search, HelpCircle, Building2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications';
import { SendInviteModal } from '@/components/invitations';
import { AppsMenu } from './AppsMenu';

export function TopNav() {
    const { data: backendUser, isLoading } = useUser();
    const { user: auth0User } = useAuth0User();
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { isCollapsed } = useSidebar();

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prioritize Backend data, fallback to Auth0 data
    const displayName = backendUser?.name || auth0User?.name || backendUser?.username || backendUser?.email?.split('@')[0] || auth0User?.nickname || 'User';
    const displayAvatar = backendUser?.avatarUrl || auth0User?.picture;
    const currentOrgId = backendUser?.currentOrgId || backendUser?.memberships?.[0]?.orgId;
    const currentMembership = backendUser?.memberships?.find(m => m.orgId === currentOrgId);
    const orgName = currentMembership?.orgName;
    const email = backendUser?.email;
    const userRole = currentMembership?.role || backendUser?.role; // Don't default to 'Member' yet

    return (
        <header
            className={cn(
                "fixed top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:left-20" : "lg:left-64"
            )}
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
                    {/* Organization Badge if exists */}
                    {orgName && (
                        <Link
                            href="/dashboard/settings/organization"
                            className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-gray-50/50 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-100 rounded-full transition-all group/org"
                        >
                            <Building2 className="w-3.5 h-3.5 text-gray-400 group-hover/org:text-[#091590] transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-500 group-hover/org:text-[#091590] uppercase tracking-tight transition-colors">{orgName}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{email}</span>
                            </div>
                        </Link>
                    )}

                    {/* Action Group */}
                    <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
                        {/* 👥 Invite Button */}
                        {/* 👥 Invite Button - Only for Owners */}
                        {userRole === 'OWNER' && (
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

                        {/* 🔔 Real-time Notification Bell with WebSocket */}
                        <NotificationBell />
                    </div>

                    {/* Apps Menu */}
                    <div className="pl-1">
                        <AppsMenu />
                    </div>

                    {/* User Profile - Premium Look */}
                    <button className="flex items-center gap-2.5 pl-1 group hover:bg-gray-50 p-1.5 rounded-xl transition-all">
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
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Invite Modal */}
            <SendInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                orgId={currentOrgId || ''}
                orgName={orgName || 'Organization'}
            />
        </header>
    );
}
