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

function MeetingsLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Sidebar />
            <TopNav />
            <main
                className={cn(
                    "pt-16 transition-all duration-300 ease-in-out min-h-screen",
                    isCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                <div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function MeetingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const { data: backendUser, isLoading: isBackendLoading, isFetching: isBackendFetching } = useUser();

    useEffect(() => {
        if (isBackendLoading) return;
        if (!backendUser && !isBackendFetching) {
            router.replace('/auth/login');
        }
    }, [backendUser, isBackendLoading, isBackendFetching, router]);

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
                <MeetingsLayoutContent>{children}</MeetingsLayoutContent>
            </SidebarProvider>
        </NotificationProvider>
    );
}
