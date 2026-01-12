'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-auth';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Settings,
    FileText,
    Users,
    LogOut,
    Menu,
    X,
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
        icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    },
    {
        label: 'Projects',
        href: '/projects',
        icon: <FolderKanban className="w-[18px] h-[18px]" />,
    },
    {
        label: 'Tasks',
        href: '/tasks',
        icon: <CheckSquare className="w-[18px] h-[18px]" />,
    },
    {
        label: 'Documents',
        href: '/documents',
        icon: <FileText className="w-[18px] h-[18px]" />,
    },
    {
        label: 'Team',
        href: '/team',
        icon: <Users className="w-[18px] h-[18px]" />,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="w-[18px] h-[18px]" />,
    },
];

export function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { mutate: logout, isPending: isLoggingOut } = useLogout();

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const SidebarContent = () => (
        <>
            {/* Logo Section - Clean and Simple */}
            <div className="h-16 px-4 flex items-center border-b border-gray-200">
                <Link href="/dashboard" className="flex items-center gap-2.5 w-full">
                    <div className="w-8 h-8 rounded-lg bg-[#091590] flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">PM</span>
                    </div>
                    <span className="font-bold text-base text-gray-900 tracking-tight">
                        Teslead Connect
                    </span>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'group flex items-center gap-2.5 px-3 py-2.5 rounded-lg',
                                'transition-all duration-200 font-medium text-[13px] relative',
                                isActive
                                    ? 'bg-[#091590] text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center",
                                isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
                            )}>
                                {item.icon}
                            </div>
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="absolute right-3 w-1 h-1 rounded-full bg-white" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-2.5 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200">
                <p className="text-[10px] text-gray-500 text-center">
                    © 2026 Teslead Connect
                </p>
            </div>
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

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    'lg:hidden flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 shadow-xl',
                    'transform transition-transform duration-300 ease-in-out',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
