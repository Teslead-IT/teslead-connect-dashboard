/**
 * Root Providers
 * Combines all providers needed for the application
 */

'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { Auth0ProviderWrapper as Auth0Provider } from './auth0-provider';

import { GlobalLoaderProvider } from './global-loader-provider';
import { PrimeReactProvider } from 'primereact/api';
import { OrgSwitchingOverlay } from '@/components/layout/OrgSwitchingOverlay';
import { Api403Handler } from '@/components/Api403Handler';
import { OrgRoleRehydrate } from '@/components/OrgRoleRehydrate';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <PrimeReactProvider>
            <QueryProvider>
                <Auth0Provider>
                    <GlobalLoaderProvider>
                        <Api403Handler />
                        <OrgRoleRehydrate />
                        {children}
                        <OrgSwitchingOverlay />
                    </GlobalLoaderProvider>
                </Auth0Provider>
            </QueryProvider>
        </PrimeReactProvider>
    );
}
