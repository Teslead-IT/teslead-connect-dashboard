/**
 * Protected Route Component
 * Wrap any page that requires authentication
 */

'use client';

import { useUser } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

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
    const { data: user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // If not loading and no user, redirect to login
        if (!isLoading && !user) {
            router.push('/auth/login');
        }

        // If user exists but account is unverified, redirect to verification
        if (user && user.accountStatus === 'UNVERIFIED') {
            router.push(`/auth/verify-email?email=${user.email}`);
        }

        // If user exists but doesn't have required role
        if (user && requiredRole) {
            const roleHierarchy = { USER: 0, ADMIN: 1, SUPER_ADMIN: 2 };
            const userLevel = roleHierarchy[user.role] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 0;

            if (userLevel < requiredLevel) {
                router.push('/unauthorized');
            }
        }
    }, [user, isLoading, router, requiredRole]);

    // Show loading state
    if (isLoading) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
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
