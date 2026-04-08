'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DialogType = 'confirmation' | 'info' | 'warning' | 'error' | 'success' | 'help';
export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogPosition = 'center' | 'top' | 'bottom';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    type?: DialogType;
    title: string;
    message: string;
    description?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'default' | 'destructive' | 'secondary' | 'primary';
    showCloseButton?: boolean;
    size?: DialogSize;
    position?: DialogPosition;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    isLoading?: boolean;
    customIcon?: React.ReactNode;
    isDark?: boolean;
    borderColor?: string;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
    showAnimation?: boolean;
    children?: React.ReactNode;
}

const typeConfig = {
    confirmation: {
        icon: CheckCircle2,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-100 dark:border-blue-500/20',
        accent: 'bg-blue-600',
    },
    info: {
        icon: Info,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        border: 'border-indigo-100 dark:border-indigo-500/20',
        accent: 'bg-indigo-600',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-100 dark:border-amber-500/20',
        accent: 'bg-amber-600',
    },
    error: {
        icon: AlertCircle,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        border: 'border-rose-100 dark:border-rose-500/20',
        accent: 'bg-rose-600',
    },
    success: {
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-100 dark:border-emerald-500/20',
        accent: 'bg-emerald-600',
    },
    help: {
        icon: HelpCircle,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        border: 'border-violet-100 dark:border-violet-500/20',
        accent: 'bg-violet-600',
    },
};

const sizeConfig = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

const positionConfig = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-24',
    bottom: 'items-end justify-center pb-24',
};

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    type = 'confirmation',
    title,
    message,
    description,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    showCloseButton = true,
    size = 'md',
    position = 'center',
    closeOnBackdrop = true,
    closeOnEscape = true,
    isLoading = false,
    customIcon,
    isDark = false,
    borderColor,
    className,
    headerClassName,
    contentClassName,
    footerClassName,
    showAnimation = true,
    children,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const config = typeConfig[type];
    const Icon = config.icon;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeOnEscape, onClose]);

    const handleConfirm = async () => {
        if (onConfirm) {
            try {
                await onConfirm();
            } catch (error) {
                console.error('Error in dialog confirm:', error);
            }
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    };

    const handleBackdropClick = () => {
        if (closeOnBackdrop) {
            onClose();
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div
                    className={cn(
                        'fixed inset-0 z-[100000] flex px-4',
                        positionConfig[position]
                    )}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/60"
                        onClick={handleBackdropClick}
                    />

                    {/* Dialog Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={cn(
                            'relative w-full bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden',
                            'border border-gray-100 dark:border-slate-800',
                            sizeConfig[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Accent Bar */}
                        <div className={cn('h-1.5 w-full', config.accent)} />

                        {/* Close Button */}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <div className="px-6 pt-8 pb-6 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                {/* Icon Wrapper */}
                                <div className={cn(
                                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                    config.bg,
                                    'border',
                                    config.border
                                )}>
                                    {customIcon ? customIcon : <Icon className={cn('w-6 h-6', config.color)} />}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                        {title}
                                    </h3>
                                    <div className="text-sm font-medium text-gray-600 dark:text-slate-400 leading-relaxed">
                                        {message}
                                    </div>
                                    {description && (
                                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {children && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    {children}
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {cancelText}
                            </button>

                            {onConfirm && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={cn(
                                        'px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50',
                                        confirmVariant === 'destructive'
                                            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                                    )}
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Dialog;
