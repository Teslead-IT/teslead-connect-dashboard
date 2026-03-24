'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { setOn403Handler } from '@/lib/api-client';

/**
 * Registers global 403 handler so permission errors show a toast.
 * Mount once inside app (e.g. Providers) so all routes get the toast.
 */
export function Api403Handler() {
    const toast = useToast();

    useEffect(() => {
        setOn403Handler(() => {
            toast.error('Permission denied', "You don't have permission to perform this action.");
        });
        return () => setOn403Handler(null);
    }, [toast]);

    return null;
}
