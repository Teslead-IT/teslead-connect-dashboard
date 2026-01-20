'use client';

import { useEffect, useState } from 'react';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthSession } from '@/lib/api-client';
import { authKeys } from '@/hooks/use-auth';
import { Loader } from '@/components/ui/Loader';

/**
 * TokenSyncProvider - Synchronizes Auth0 tokens with backend
 * 
 * This provider handles the token exchange flow for social login:
 * 1. Detects Auth0 user session
 * 2. Fetches backend tokens from /api/auth/token
 * 3. Stores tokens and updates TanStack Query cache
 * 4. Shows loading state during sync to prevent flickering
 */
export function TokenSyncProvider({ children }: { children: React.ReactNode }) {
    const { user: auth0User, isLoading: isAuth0Loading } = useAuth0User();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncComplete, setSyncComplete] = useState(false);

    useEffect(() => {
        async function syncToken() {
            // Only sync if:
            // 1. Auth0 user exists
            // 2. Not currently loading Auth0 session
            // 3. Haven't already synced
            if (auth0User && !isAuth0Loading && !syncComplete) {
                setIsSyncing(true);
                try {
                    const res = await fetch('/api/auth/token');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.accessToken) {
                            // Store token and user in local storage
                            setAuthSession(data.accessToken, data.refreshToken, auth0User);

                            // Update TanStack Query cache immediately
                            queryClient.setQueryData(authKeys.user(), auth0User);

                            // Invalidate to trigger a fresh fetch with new tokens
                            await queryClient.invalidateQueries({ queryKey: authKeys.user() });

                            setSyncComplete(true);
                        }
                    } else {
                        console.error('Failed to fetch backend token');
                    }
                } catch (error) {
                    console.error('Failed to sync token', error);
                } finally {
                    setIsSyncing(false);
                }
            } else if (!auth0User && !isAuth0Loading) {
                // No Auth0 user and not loading - sync is "complete" (nothing to sync)
                setSyncComplete(true);
            }
        }

        syncToken();
    }, [auth0User, isAuth0Loading, syncComplete, queryClient]);

    // Reset sync state when Auth0 user changes (login/logout)
    useEffect(() => {
        setSyncComplete(false);
    }, [auth0User?.sub]); // Track by user ID to detect user changes

    // Show loader during initial Auth0 loading or token sync
    if (isAuth0Loading || (auth0User && isSyncing)) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader size={200} />
            </div>
        );
    }

    return <>{children}</>;
}
