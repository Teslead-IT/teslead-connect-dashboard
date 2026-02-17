'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useUser } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { NotificationProvider } from '@/context/NotificationContext';
import { Loader } from '@/components/ui/Loader';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { motion } from 'framer-motion';

function ProjectsLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <TopNav />
            <motion.main
                initial={false}
                animate={{ marginLeft: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="pt-16 h-screen"
            >
                {children}
            </motion.main>
        </div>
    );
}

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    // Check both Auth0 session (Social Login) and Backend session (Email/Password)
    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading } = useUser();

    useEffect(() => {
        // Wait for both checks to complete
        if (isAuth0Loading || isBackendLoading) {
            return;
        }

        // If no user session exists at all, redirect to login
        if (!auth0User && !backendUser) {
            router.replace('/auth/login');
        }
    }, [auth0User, backendUser, isAuth0Loading, isBackendLoading, router]);

    // Show loading state while checking authentication
    if (isAuth0Loading || isBackendLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    // Don't render projects if not authenticated
    if (!auth0User && !backendUser) {
        return null;
    }

    return (
        <NotificationProvider>
            <SidebarProvider>
                <ProjectsLayoutContent>{children}</ProjectsLayoutContent>
            </SidebarProvider>
        </NotificationProvider>
    );
}
