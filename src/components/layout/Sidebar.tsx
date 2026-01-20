'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { useLogout } from '@/hooks/use-auth';
import { useSidebar } from '@/context/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    FileText,
    Users,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
    },
    {
        label: 'Projects',
        href: '/projects',
        icon: <FolderKanban className="w-5 h-5 flex-shrink-0" />,
    },
    {
        label: 'Documents',
        href: '/documents',
        icon: <FileText className="w-5 h-5 flex-shrink-0" />,
    },
    {
        label: 'Team',
        href: '/team',
        icon: <Users className="w-5 h-5 flex-shrink-0" />,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="w-5 h-5 flex-shrink-0" />,
    },
];

export function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { mutate: logout, isPending: isLoggingOut } = useLogout();

    const handleLogout = () => {
        setIsLogoutDialogOpen(true);
    };

    const SidebarContent = () => (
        <>
            {/* Logo Section */}
            <div className={cn(
                "h-16 flex items-center border-b border-gray-200 transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
                    <div className="relative w-8 h-8 flex-shrink-0">
                        <Image
                            src="/logo/single-logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isCollapsed ? 0 : 1,
                            width: isCollapsed ? 0 : 'auto'
                        }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap overflow-hidden"
                    >
                        Teslead Connect
                    </motion.div>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'group flex items-center gap-3 px-3 py-2.5 rounded-lg',
                                'transition-all duration-200 font-medium text-sm relative',
                                isActive
                                    ? 'bg-[#091590] text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                                isCollapsed ? 'justify-center px-2' : ''
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <div className={cn(
                                "flex items-center justify-center transition-colors",
                                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
                            )}>
                                {item.icon}
                            </div>

                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    {item.label}
                                </motion.span>
                            )}

                            {isActive && !isCollapsed && (
                                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-3 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                        isCollapsed ? "justify-center" : ""
                    )}
                    title={isCollapsed ? "Logout" : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </motion.span>
                    )}
                </button>
            </div>

            {/* Collapse Toggle Button (Desktop Only) */}
            <button
                onClick={toggleSidebar}
                className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors z-50 cursor-pointer"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Desktop Sidebar with Animation */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40"
            >
                <SidebarContent />
            </motion.aside>


            {/* Mobile Sidebar (Fixed w-64) */}
            <aside
                className={cn(
                    'lg:hidden flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 shadow-xl',
                    'transform transition-transform duration-300 ease-in-out',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarContent />
            </aside>

            {/* Logout Dialog */}
            <Dialog
                isOpen={isLogoutDialogOpen}
                onClose={() => setIsLogoutDialogOpen(false)}
                type="confirmation"
                title="Confirm Logout"
                message="Are you sure you want to log out of specific session?"
                confirmText="Logout"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={logout}
                isLoading={isLoggingOut}
            />
        </>
    );
}
