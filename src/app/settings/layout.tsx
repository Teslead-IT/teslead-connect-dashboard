'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/use-auth';
import { useOrgStore } from '@/stores/orgStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { OrgBootSync } from '@/components/OrgBootSync';
import { PresenceSync } from '@/components/PresenceSync';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Settings, Building2 } from 'lucide-react';

const settingsNavItems = [
    {
        label: 'Account Settings',
        href: '/settings/account',
        icon: <Settings className="w-4 h-4" />,
    },
    {
        label: 'Organization Settings',
        href: '/settings/organization',
        icon: <Building2 className="w-4 h-4" />,
    },
];

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50">
            <OrgBootSync />
            <PresenceSync />
            <Sidebar />
            <TopNav />
            <motion.main
                initial={false}
                animate={{ marginLeft: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="pt-16"
            >
                <div className="p-4 lg:p-6">
                    {/* Settings Content */}
                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </motion.main>
        </div>
    );
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const { data: backendUser, isLoading: isBackendLoading } = useUser();

    useEffect(() => {
        if (isBackendLoading) return;
        if (!backendUser) {
            router.replace('/auth/login');
            return;
        }
        if (backendUser && activeOrgId === null) {
            router.replace('/organization');
        }
    }, [backendUser, isBackendLoading, activeOrgId, router]);

    if (isBackendLoading) return null;

    return (
        <SidebarProvider>
            <SettingsLayoutContent>{children}</SettingsLayoutContent>
        </SidebarProvider>
    );
}
