'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, Suspense, useCallback } from 'react';
import { Loader } from '@/components/ui/Loader';
import { usePathname, useSearchParams } from 'next/navigation';

interface GlobalLoaderContextType {
    isLoading: boolean;
    showLoader: () => void;
    hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

function RouteChangeListener() {
    const { hideLoader } = useGlobalLoader();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        hideLoader();
    }, [pathname, searchParams, hideLoader]);

    return null;
}

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);

    const showLoader = () => setIsLoading(true);
    const hideLoader = useCallback(() => setIsLoading(false), []);

    return (
        <GlobalLoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
            {children}
            <Suspense fallback={null}>
                <RouteChangeListener />
            </Suspense>
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-md">
                    <Loader size={100} />
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
}

export function useGlobalLoader() {
    const context = useContext(GlobalLoaderContext);
    if (!context) {
        throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider');
    }
    return context;
}
