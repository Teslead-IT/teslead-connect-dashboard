/**
 * Root Providers
 * Combines all providers needed for the application
 */

'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { Auth0ProviderWrapper as Auth0Provider } from './auth0-provider';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            <Auth0Provider>
                {children}
            </Auth0Provider>
        </QueryProvider>
    );
}
