'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-auth';
import { useOrgStore } from '@/stores/orgStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { NotificationProvider } from '@/context/NotificationContext';
import { Loader } from '@/components/ui/Loader';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { PresenceSync } from '@/components/PresenceSync';
import { OrgBootSync } from '@/components/OrgBootSync';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function TeamLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <OrgBootSync />
            <PresenceSync />
            <Sidebar />
            <TopNav />
            <motion.main
                initial={false}
                animate={{ marginLeft: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="pt-16 min-h-screen flex flex-col"
            >
                {children}
            </motion.main>
        </div>
    );
}

export default function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const { data: backendUser, isLoading: isBackendLoading, isFetching: isBackendFetching } = useUser();

    useEffect(() => {
        if (isBackendLoading) return;

        if (!backendUser && !isBackendFetching) {
            router.replace('/auth/login');
            return;
        }

        if (backendUser && activeOrgId === null) {
            router.replace('/organization');
        }
    }, [backendUser, isBackendLoading, isBackendFetching, activeOrgId, router]);

    if (isBackendLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (!backendUser && !isBackendFetching) {
        return null;
    }

    return (
        <NotificationProvider>
            <SidebarProvider>
                <TeamLayoutContent>{children}</TeamLayoutContent>
            </SidebarProvider>
        </NotificationProvider>
    );
}
