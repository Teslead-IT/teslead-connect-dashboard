'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { usePathname, useSearchParams } from 'next/navigation';

interface GlobalLoaderContextType {
    isLoading: boolean;
    showLoader: () => void;
    hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Auto-hide loader on route change if it was stuck
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);

    return (
        <GlobalLoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
            {children}
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
