'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    confirmVariant?: 'default' | 'destructive' | 'secondary';
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
        color: 'bg-[#091590] dark:bg-[#091590]',
        borderColor: 'border-[#091590]/20',
        headerColor: 'text-white',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
    },
    info: {
        icon: Info,
        color: 'bg-blue-600 dark:bg-blue-700',
        borderColor: 'border-blue-500/20',
        headerColor: 'text-white',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
    },
    warning: {
        icon: AlertTriangle,
        color: 'bg-[#3c1e13] dark:bg-[#3c1e13]',
        borderColor: 'border-[#4c2e23]',
        headerColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
    },
    error: {
        icon: AlertCircle,
        color: 'bg-red-950 dark:bg-red-950',
        borderColor: 'border-red-900',
        headerColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-500',
    },
    success: {
        icon: CheckCircle,
        color: 'bg-emerald-950 dark:bg-emerald-950',
        borderColor: 'border-emerald-900',
        headerColor: 'text-emerald-500',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
    },
    help: {
        icon: HelpCircle,
        color: 'bg-purple-950 dark:bg-purple-950',
        borderColor: 'border-purple-900',
        headerColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
    },
};

const sizeConfig = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
};

const positionConfig = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    bottom: 'items-end justify-center pb-20',
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
    isDark = true, // Default to dark for the premium look
    borderColor,
    className,
    headerClassName,
    contentClassName,
    footerClassName,
    showAnimation = true,
    children,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const config = typeConfig[type];
    const Icon = config.icon;

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

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
                onClose();
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

    if (!mounted || (!isOpen && !isAnimating)) return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-[100000] flex transition-all duration-300',
                positionConfig[position],
                isOpen && isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div
                className={cn(
                    'absolute inset-0 backdrop-blur-sm transition-opacity duration-300',
                    'bg-slate-900/40 dark:bg-black/60',
                    isOpen && isAnimating ? 'opacity-100' : 'opacity-0',
                )}
                onClick={handleBackdropClick}
            />

            {/* Dialog Content */}
            <div
                className={cn(
                    'relative w-full mx-4 rounded-xl shadow-2xl overflow-hidden',
                    'border transition-all duration-300',
                    'bg-[#0f172a] dark:bg-[#0f172a]', // Match Image 1 dark background
                    sizeConfig[size],
                    borderColor || config.borderColor,
                    className,
                    showAnimation && isOpen && isAnimating
                        ? 'scale-100 translate-y-0'
                        : 'scale-95 translate-y-4',
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div
                    className={cn(
                        'relative px-6 py-4 flex items-center gap-4',
                        config.color,
                        'border-b',
                        borderColor || config.borderColor,
                        headerClassName,
                    )}
                >
                    <div
                        className={cn(
                            'p-1.5 rounded-lg flex-shrink-0',
                            config.iconBg,
                        )}
                    >
                        {customIcon ? (
                            customIcon
                        ) : (
                            <Icon className={cn('w-5 h-5', config.iconColor)} />
                        )}
                    </div>

                    <div className="flex-1">
                        <h2
                            className={cn(
                                'text-base font-bold tracking-tight',
                                config.headerColor,
                            )}
                        >
                            {title}
                        </h2>
                    </div>

                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-1 rounded-md transition-all duration-200',
                                'hover:bg-black/10 dark:hover:bg-white/10 text-white/40 hover:text-white',
                            )}
                            aria-label="Close dialog"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={cn('px-6 py-8', contentClassName)}>
                    <p className="text-[13px] text-gray-300 leading-relaxed font-medium">
                        {message}
                    </p>
                    {description && (
                        <p className="text-xs text-gray-500 mt-2">
                            {description}
                        </p>
                    )}
                    {children}
                </div>

                {/* Footer */}
                <div
                    className={cn(
                        'flex gap-3 px-6 py-4 bg-slate-900/50',
                        'border-t',
                        borderColor || config.borderColor,
                        'justify-end',
                        footerClassName,
                    )}
                >
                    {(onCancel !== undefined || type === 'confirmation' || type === 'warning') && (
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className={cn(
                                'px-5 py-2 rounded-lg font-bold transition-all duration-200',
                                'bg-[#1e293b] text-gray-300 hover:bg-[#334155]',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'active:scale-95 text-[11px] uppercase tracking-wider',
                            )}
                        >
                            {cancelText}
                        </button>
                    )}

                    {onConfirm && (
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={cn(
                                'px-5 py-2 rounded-lg font-bold transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-[11px] uppercase tracking-wider',
                                'flex items-center gap-2 min-w-max shadow-lg',
                                confirmVariant === 'destructive'
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                                    : 'bg-[#091590] hover:bg-[#071170] text-white shadow-blue-900/20',
                            )}
                        >
                            {isLoading && (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Dialog;
