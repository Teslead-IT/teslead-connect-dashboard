'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { setAuthSession } from '@/lib/api-client';

export function TokenSyncProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser();

    useEffect(() => {
        async function syncToken() {
            if (user && !isLoading) {
                try {
                    const res = await fetch('/api/auth/token');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.accessToken) {
                            // Store token and user so api-client can use it
                            setAuthSession(data.accessToken, data.refreshToken, user);
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync token', error);
                }
            }
        }

        syncToken();
    }, [user, isLoading]);

    return <>{children}</>;
}
