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
import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <TopNav />
            <main
                className={cn(
                    "pt-16 transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    // Check both Auth0 session (Social Login) and Backend session (Email/Password)
    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading, isFetching: isBackendFetching } = useUser();

    useEffect(() => {
        // Wait for auth check to complete
        if (isBackendLoading) {
            return;
        }

        // If no backend session (access token) exists, redirect to login
        // We do not rely on auth0User here because we need valid backend tokens for API calls
        // We also wait if we are currently fetching/verifying the user
        if (!backendUser && !isBackendFetching) {
            router.replace('/auth/login');
        }
    }, [backendUser, isBackendLoading, isBackendFetching, router]);

    // Show loading state while checking authentication
    if (isBackendLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    // Don't render dashboard if not authenticated
    if (!backendUser && !isBackendFetching) {
        return null;
    }

    return (
        <NotificationProvider>
            <SidebarProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </SidebarProvider>
        </NotificationProvider>
    );
}
