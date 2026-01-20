/**
 * Protected Route Component
 * Wrap any page that requires authentication
 */

'use client';

import { useUser } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader } from '@/components/ui/Loader';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    fallback?: ReactNode;
}

export function ProtectedRoute({
    children,
    requiredRole,
    fallback
}: ProtectedRouteProps) {
    const { data: user, isLoading, isFetching } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Don't redirect while still loading or fetching
        if (isLoading || isFetching) {
            return;
        }

        // If not loading and no user, redirect to login
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // If user exists but account is unverified, redirect to verification
        if (user.accountStatus === 'UNVERIFIED') {
            router.push(`/auth/verify-email?email=${user.email}`);
            return;
        }

        // If user exists but doesn't have required role
        if (requiredRole) {
            const roleHierarchy = { USER: 0, ADMIN: 1, SUPER_ADMIN: 2 };
            const userRole = user.role || 'USER';
            const userLevel = roleHierarchy[userRole] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 0;

            if (userLevel < requiredLevel) {
                router.push('/unauthorized');
            }
        }
    }, [user, isLoading, isFetching, router, requiredRole]);

    // Show loading state while checking auth or fetching
    if (isLoading || isFetching) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader size={200} />
            </div>
        );
    }

    // Show nothing if redirecting
    if (!user) {
        return null;
    }

    // User is authenticated and authorized
    return <>{children}</>;
}
