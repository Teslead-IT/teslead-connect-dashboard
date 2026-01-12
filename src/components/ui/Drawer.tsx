'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    position?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
}

export function Drawer({
    isOpen,
    onClose,
    title,
    children,
    position = 'right',
    size = 'md',
}: DrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
    };

    const slideDirection = position === 'right' ? 1 : -1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: slideDirection * 100 + '%' }}
                        animate={{ x: 0 }}
                        exit={{ x: slideDirection * 100 + '%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={cn(
                            'fixed top-0 bottom-0 z-50 flex flex-col',
                            'bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]',
                            'shadow-2xl w-full',
                            position === 'right' ? 'right-0 border-l' : 'left-0 border-r',
                            sizeStyles[size]
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)] flex-shrink-0">
                            {title && (
                                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                                    {title}
                                </h2>
                            )}
                            <button
                                onClick={onClose}
                                className={cn(
                                    'p-1 rounded-lg text-[var(--color-text-secondary)]',
                                    'hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
                                    'transition-colors ml-auto'
                                )}
                                aria-label="Close drawer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
