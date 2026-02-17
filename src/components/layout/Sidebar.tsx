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
    ChevronDown,
    Bell,
    Calendar,
} from 'lucide-react';

interface NavItemBase {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavItemWithChildren extends NavItemBase {
    children?: NavItemBase[];
}

type NavItem = NavItemBase | NavItemWithChildren;

function hasChildren(item: NavItem): item is NavItemWithChildren {
    return 'children' in item && Array.isArray((item as NavItemWithChildren).children) && (item as NavItemWithChildren).children!.length > 0;
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
        children: [
            { label: 'Projects', href: '/projects', icon: <FolderKanban className="w-4 h-4 flex-shrink-0" /> },
            { label: 'Tasks', href: '/projects/tasks', icon: <ListTodo className="w-4 h-4 flex-shrink-0" /> },
        ],
    },
    {
        label: 'Meetings',
        href: '/meetings',
        icon: <Calendar className="w-5 h-5 flex-shrink-0" />,
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
        label: 'Notifications',
        href: '/notifications',
        icon: <Bell className="w-5 h-5 flex-shrink-0" />,
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
    const [projectsSubmenuOpen, setProjectsSubmenuOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.location.pathname.startsWith('/projects');
    });
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();

    // Keep submenu open when on projects routes
    React.useEffect(() => {
        if (pathname.startsWith('/projects')) {
            setProjectsSubmenuOpen(true);
        }
    }, [pathname]);

    const { mutate: logout, isPending: isLoggingOut } = useLogout();

    const handleLogout = () => {
        setIsLogoutDialogOpen(true);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white relative">
            {/* Logo Section */}
            <div className="h-16 flex items-center border-b border-gray-200 px-6 overflow-hidden">
                <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                    <div className="relative w-8 h-8 flex-shrink-0">
                        <Image
                            src="/logo/single-logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <motion.span
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap overflow-hidden"
                    >
                        Teslead Connect
                    </motion.span>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const hasChildrenItem = hasChildren(item);
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                        <div key={item.href} className="relative">
                            <Link
                                href={item.href}
                                onClick={(e) => {
                                    if (hasChildrenItem && !isCollapsed) {
                                        e.preventDefault();
                                        setProjectsSubmenuOpen((prev) => !prev);
                                    }
                                    if (mobileOpen) setMobileOpen(false);
                                }}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm relative',
                                    isActive ? 'bg-[#091590] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                                    isCollapsed ? 'justify-center' : ''
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <div className={cn(
                                    "flex items-center justify-center transition-colors min-w-[20px]",
                                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
                                )}>
                                    {item.icon}
                                </div>

                                <motion.span
                                    initial={false}
                                    animate={{
                                        opacity: isCollapsed ? 0 : 1,
                                        width: isCollapsed ? 0 : 'auto',
                                        marginLeft: isCollapsed ? 0 : 0
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="whitespace-nowrap overflow-hidden flex-1 text-left"
                                >
                                    {item.label}
                                </motion.span>

                                {!isCollapsed && hasChildrenItem && (
                                    <motion.div
                                        animate={{ rotate: projectsSubmenuOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className={cn(
                                            "flex-shrink-0",
                                            isActive ? "text-white" : "text-gray-500"
                                        )}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </motion.div>
                                )}

                                {/* {isActive && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className={cn(
                                            "absolute rounded-full bg-white opacity-50",
                                            isCollapsed ? "w-1 h-1 right-1" : "right-3 w-1.5 h-1.5"
                                        )}
                                    />
                                )} */}
                            </Link>

                            {/* Submenu - Optimized for smoothness */}
                            {hasChildrenItem && !isCollapsed && (
                                <AnimatePresence initial={false}>
                                    {projectsSubmenuOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-4 mt-1 pl-6 border-l border-gray-200 space-y-0.5 pointer-events-auto">
                                                {item.children!.map((child) => {
                                                    const isChildActive = pathname === child.href || (child.href !== '/projects' && pathname.startsWith(child.href));
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={(e) => {
                                                                if (mobileOpen) setMobileOpen(false);
                                                            }}
                                                            className={cn(
                                                                'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors duration-200',
                                                                isChildActive
                                                                    ? 'bg-[#091590]/10 text-[#091590] font-semibold'
                                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                            )}
                                                        >
                                                            {child.icon}
                                                            <span className="truncate">{child.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-3 border-t border-gray-200 mt-auto">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                        isCollapsed ? "justify-center" : ""
                    )}
                    title={isCollapsed ? "Logout" : undefined}
                >
                    <div className="flex-shrink-0">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <motion.span
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap overflow-hidden"
                    >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </motion.span>
                </button>
            </div>

            {/* Collapse Toggle Button (Desktop Only) */}
            <button
                onClick={toggleSidebar}
                className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors z-50 cursor-pointer"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar with Animation */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40 shadow-sm"
            >
                <SidebarContent />
            </motion.aside>

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
