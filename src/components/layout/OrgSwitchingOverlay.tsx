'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrgStore } from '@/stores/orgStore';
import { Building2, Loader2 } from 'lucide-react';

/**
 * Full-screen overlay shown while switching organization.
 * Uses a minimum display time (from useSwitchOrg) so the loading state is visible and the new UI can render.
 */
export function OrgSwitchingOverlay() {
    const isSwitching = useOrgStore((s) => s.isSwitching);

    return (
        <AnimatePresence>
            {isSwitching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md"
                    aria-live="polite"
                    aria-busy="true"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="flex flex-col items-center gap-6 px-10 py-12 rounded-2xl bg-white border border-gray-100 shadow-2xl"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-14 h-14 rounded-full border-2 border-[#091590]/15 border-t-[#091590]"
                            />
                            <Building2 className="absolute inset-0 m-auto w-5 h-5 text-[#091590]" />
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-base font-semibold text-gray-900">Switching organization</p>
                            <p className="text-sm text-gray-500">Updating context and loading your workspace…</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-medium">Please wait</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
