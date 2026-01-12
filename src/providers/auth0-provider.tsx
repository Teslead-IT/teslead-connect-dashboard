'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { TokenSyncProvider } from './token-sync-provider';

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <TokenSyncProvider>
                {children}
            </TokenSyncProvider>
        </UserProvider>
    );
}
