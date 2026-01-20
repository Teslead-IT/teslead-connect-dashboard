'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, HelpCircle } from 'lucide-react';
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
}

const typeConfig = {
    confirmation: {
        icon: CheckCircle,
        color: 'bg-[#091590]/5 dark:bg-[#091590]/20',
        borderColor: 'border-[#091590]/10 dark:border-[#091590]/30',
        headerColor: 'text-[#091590] dark:text-blue-300',
        iconBg: 'bg-[#091590]/10 dark:bg-[#091590]/30',
        iconColor: 'text-[#091590] dark:text-blue-400',
    },
    info: {
        icon: Info,
        color: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950 dark:to-cyan-900/50',
        borderColor: 'border-cyan-200/60 dark:border-cyan-800/60',
        headerColor: 'text-cyan-700 dark:text-cyan-300',
        iconBg: 'bg-cyan-100 dark:bg-cyan-900/50',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    warning: {
        icon: AlertTriangle,
        color: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50',
        borderColor: 'border-amber-200/60 dark:border-amber-800/60',
        headerColor: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
    error: {
        icon: AlertCircle,
        color: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50',
        borderColor: 'border-red-200/60 dark:border-red-800/60',
        headerColor: 'text-red-700 dark:text-red-300',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
        iconColor: 'text-red-600 dark:text-red-400',
    },
    success: {
        icon: CheckCircle,
        color: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50',
        borderColor: 'border-emerald-200/60 dark:border-emerald-800/60',
        headerColor: 'text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    help: {
        icon: HelpCircle,
        color: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50',
        borderColor: 'border-purple-200/60 dark:border-purple-800/60',
        headerColor: 'text-purple-700 dark:text-purple-300',
        iconBg: 'bg-purple-100 dark:bg-purple-900/50',
        iconColor: 'text-purple-600 dark:text-purple-400',
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
    isDark = false,
    borderColor,
    className,
    headerClassName,
    contentClassName,
    footerClassName,
    showAnimation = true,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

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

    if (!isOpen && !isAnimating) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex transition-all duration-300',
                positionConfig[position],
                isOpen && isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div
                className={cn(
                    'absolute inset-0 backdrop-blur-md transition-opacity duration-300',
                    isDark ? 'bg-black/60' : 'bg-black/40',
                    isOpen && isAnimating ? 'opacity-100' : 'opacity-0',
                )}
                onClick={handleBackdropClick}
            />

            {/* Dialog Content */}
            <div
                className={cn(
                    'relative w-full mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-lg',
                    'border transition-all duration-300',
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
                        'relative p-5 pb-4',
                        config.color,
                        'border-b',
                        borderColor || config.borderColor,
                        headerClassName,
                    )}
                >
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className={cn(
                                'absolute top-4 right-4 p-1 rounded-lg transition-all duration-200',
                                'hover:bg-black/8 dark:hover:bg-white/10 active:scale-95',
                            )}
                            aria-label="Close dialog"
                        >
                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}

                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'p-2 rounded-lg flex-shrink-0 mt-0.5',
                                config.iconBg,
                            )}
                        >
                            {customIcon ? (
                                customIcon
                            ) : (
                                <Icon className={cn('w-5 h-5', config.iconColor)} />
                            )}
                        </div>

                        <div className="flex-1 pr-6">
                            <h2
                                className={cn(
                                    'text-base font-bold',
                                    config.headerColor,
                                    headerClassName,
                                )}
                            >
                                {title}
                            </h2>
                            {description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={cn('p-5', contentClassName)}>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div
                    className={cn(
                        'flex gap-2.5 px-5 py-4 bg-gray-50/50 dark:bg-slate-800/50',
                        'border-t',
                        borderColor || config.borderColor,
                        'rounded-b-xl justify-end',
                        footerClassName,
                    )}
                >
                    {(onCancel !== undefined || type === 'confirmation' || type === 'warning') && (
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className={cn(
                                'px-4 py-1.5 rounded-md font-medium transition-all duration-200',
                                'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100',
                                'hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed',
                                'active:scale-95 text-xs',
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
                                'px-4 py-1.5 rounded-md font-medium transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xs',
                                'flex items-center gap-2 min-w-max',
                                confirmVariant === 'destructive'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : confirmVariant === 'secondary'
                                        ? 'bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-slate-500'
                                        : `${config.iconBg} ${config.iconColor} hover:shadow-md`,
                            )}
                        >
                            {isLoading && (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dialog;
