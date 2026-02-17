'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    X,
    AlertCircle,
    CheckCircle,
    Info,
    AlertTriangle,
    Loader,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType =
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'loading'
    | 'custom';
export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
export type ToastDuration = number | null;

interface ToastProps {
    id?: string;
    type?: ToastType;
    title: string;
    message?: string;
    duration?: ToastDuration;
    position?: ToastPosition;
    onClose?: () => void;
    dismissible?: boolean;
    customIcon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    containerClassName?: string;
    showAnimation?: boolean;
    progress?: boolean;
    variant?: 'default' | 'minimal' | 'outline' | 'gradient';
    isDark?: boolean;
    soundEnabled?: boolean;
}

interface ToastContainerProps {
    position?: ToastPosition;
    maxToasts?: number;
}

const typeConfig = {
    success: {
        icon: CheckCircle,
        color: 'from-emerald-600 to-green-600',
        textColor: 'text-white',
        iconColor: 'text-emerald-100',
        bgColor: 'bg-emerald-950 shadow-2xl',
        borderColor: 'border-emerald-900',
        progressColor: 'bg-emerald-400',
    },
    error: {
        icon: AlertCircle,
        color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
        textColor: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-white dark:bg-slate-900 shadow-md',
        borderColor: 'border-red-200 dark:border-red-800',
        progressColor: 'bg-gradient-to-r from-red-500 to-rose-600',
    },
    warning: {
        icon: AlertTriangle,
        color: 'from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10',
        textColor: 'text-amber-700 dark:text-amber-300',
        iconColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-white dark:bg-slate-900 shadow-md',
        borderColor: 'border-amber-200 dark:border-amber-800',
        progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    info: {
        icon: Info,
        color: 'from-[#091590]/10 to-blue-500/10 dark:from-blue-500/10 dark:to-cyan-500/10',
        textColor: 'text-[#091590] dark:text-blue-300',
        iconColor: 'text-[#091590] dark:text-blue-400',
        bgColor: 'bg-white dark:bg-slate-900 shadow-md',
        borderColor: 'border-[#091590]/10 dark:border-blue-800',
        progressColor: 'bg-gradient-to-r from-[#091590] to-blue-600',
    },
    loading: {
        icon: Loader,
        color: 'from-[#091590]/10 to-indigo-500/10 dark:from-purple-500/10 dark:to-indigo-500/10',
        textColor: 'text-[#091590] dark:text-purple-300',
        iconColor: 'text-[#091590] dark:text-purple-400',
        bgColor: 'bg-white dark:bg-slate-900 shadow-md',
        borderColor: 'border-[#091590]/10 dark:border-purple-800',
        progressColor: 'bg-gradient-to-r from-[#091590] to-indigo-600',
    },
    custom: {
        icon: Zap,
        color: 'from-slate-500/20 to-gray-500/20 dark:from-slate-500/10 dark:to-gray-500/10',
        textColor: 'text-slate-700 dark:text-slate-300',
        iconColor: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-white dark:bg-slate-900 shadow-md',
        borderColor: 'border-slate-200 dark:border-slate-800',
        progressColor: 'bg-gradient-to-r from-slate-500 to-gray-500',
    },
};

const positionConfig = {
    'top-left': 'top-6 left-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-6 right-6',
};

export const Toast: React.FC<ToastProps> = ({
    id = Math.random().toString(36).substr(2, 9),
    type = 'info',
    title,
    message,
    duration = 4000,
    position = 'top-right',
    onClose,
    dismissible = true,
    customIcon,
    action,
    className,
    containerClassName,
    showAnimation = true,
    progress = true,
    variant = 'default',
    isDark = false,
    soundEnabled = false,
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress_, setProgress] = useState(100);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const config = typeConfig[type];
    const Icon = config.icon;

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onClose?.();
        }, 300);
    }, [onClose]);

    useEffect(() => {
        if (duration && duration > 0 && duration !== null) {
            if (progress) {
                progressIntervalRef.current = setInterval(() => {
                    setProgress((prev) => Math.max(prev - (100 / (duration / 50)), 0));
                }, 50);
            }

            timeoutRef.current = setTimeout(() => {
                handleClose();
            }, duration);
        }

        return () => {
            clearInterval(progressIntervalRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [duration, handleClose, progress]);

    const variantStyles = {
        default: `${config.bgColor} border ${config.borderColor}`,
        minimal: 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-md',
        outline: `bg-transparent border-2 ${config.borderColor}`,
        gradient: `bg-gradient-to-r ${config.color} border ${config.borderColor}`,
    };

    return (
        <div
            className={cn(
                'fixed z-50 transition-all duration-300 ease-out',
                positionConfig[position],
                containerClassName,
                isExiting
                    ? 'opacity-0 translate-x-full scale-95'
                    : 'opacity-100 translate-x-0 scale-100',
            )}
            role="alert"
            aria-live="polite"
        >
            <div
                className={cn(
                    'flex items-start gap-3 px-4 py-3.5 rounded-lg shadow-lg',
                    'min-w-72 max-w-sm overflow-hidden',
                    variantStyles[variant],
                    className,
                )}
            >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {customIcon ? (
                        customIcon
                    ) : type === 'loading' ? (
                        <Icon className={cn('w-5 h-5 animate-spin', config.iconColor)} />
                    ) : (
                        <Icon className={cn('w-5 h-5', config.iconColor)} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-sm', config.textColor)}>
                        {title}
                    </h3>
                    {message && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed break-words mt-1">
                            {message}
                        </p>
                    )}

                    {/* Action Button */}
                    {action && (
                        <button
                            onClick={() => {
                                action.onClick();
                                handleClose();
                            }}
                            className={cn(
                                'mt-2 text-xs font-semibold transition-all duration-200',
                                'hover:opacity-80 focus:outline-none active:scale-95',
                                config.textColor,
                            )}
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                {/* Close Button */}
                {dismissible && (
                    <button
                        onClick={handleClose}
                        className={cn(
                            'flex-shrink-0 p-1 rounded-md transition-all duration-200',
                            'hover:bg-black/8 dark:hover:bg-white/10 active:scale-90',
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
                        )}
                        aria-label="Close notification"
                    >
                        <X className={cn('w-4 h-4', config.iconColor)} />
                    </button>
                )}

                {/* Progress Bar */}
                {progress && duration && duration > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-black/5 dark:bg-white/5 w-full">
                        <div
                            className={cn('h-full transition-all duration-100', config.progressColor)}
                            style={{ width: `${progress_}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Toast Manager for handling multiple toasts
interface ToastItem extends ToastProps {
    id: string;
}

class ToastManager {
    private static instance: ToastManager;
    private toasts: ToastItem[] = [];
    private listeners: Set<(toasts: ToastItem[]) => void> = new Set();
    private container: HTMLElement | null = null;

    private constructor() { }

    static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager();
        }
        return ToastManager.instance;
    }

    subscribe = (listener: (toasts: ToastItem[]) => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        this.listeners.forEach((listener) => listener([...this.toasts]));
    }

    show = (options: Omit<ToastProps, 'onClose'>): string => {
        const id = options.id || Math.random().toString(36).substr(2, 9);
        const toast: ToastItem = {
            ...options,
            id,
            onClose: () => this.remove(id),
        };

        const existingIndex = this.toasts.findIndex((t) => t.id === id);
        if (existingIndex > -1) {
            this.toasts = [...this.toasts];
            this.toasts[existingIndex] = toast;
        } else {
            this.toasts = [...this.toasts, toast];
        }

        this.notify();
        return id;
    }

    success = (title: string, message?: string, options?: Omit<ToastProps, 'type' | 'title' | 'message'>) => {
        return this.show({ ...options, type: 'success', title, message });
    }

    error = (title: string, message?: string, options?: Omit<ToastProps, 'type' | 'title' | 'message'>) => {
        return this.show({ ...options, type: 'error', title, message });
    }

    warning = (title: string, message?: string, options?: Omit<ToastProps, 'type' | 'title' | 'message'>) => {
        return this.show({ ...options, type: 'warning', title, message });
    }

    info = (title: string, message?: string, options?: Omit<ToastProps, 'type' | 'title' | 'message'>) => {
        return this.show({ ...options, type: 'info', title, message });
    }

    loading = (title: string, message?: string, options?: Omit<ToastProps, 'type' | 'title' | 'message'>) => {
        return this.show({ ...options, type: 'loading', title, message });
    }

    remove = (id: string) => {
        this.toasts = this.toasts.filter((toast) => toast.id !== id);
        this.notify();
    }

    removeAll = () => {
        this.toasts = [];
        this.notify();
    }

    getToasts = (): ToastItem[] => {
        return [...this.toasts];
    }
}

export const useToast = () => {
    return ToastManager.getInstance();
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
    position = 'top-right',
    maxToasts = 5,
}) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const manager = useToast();

    useEffect(() => {
        const unsubscribe = manager.subscribe(setToasts);
        return unsubscribe;
    }, [manager]);

    const displayedToasts = toasts.slice(-maxToasts);

    const getPositionClasses = (pos: ToastPosition) => {
        switch (pos) {
            case 'top-left': return 'top-0 left-0 items-start flex-col';
            case 'top-center': return 'top-0 left-1/2 -translate-x-1/2 items-center flex-col';
            case 'top-right': return 'top-0 right-0 items-end flex-col';
            case 'bottom-left': return 'bottom-0 left-0 items-start flex-col-reverse';
            case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse';
            case 'bottom-right': return 'bottom-0 right-0 items-end flex-col-reverse';
            default: return 'top-0 right-0 items-end flex-col';
        }
    };

    return (
        <div className={cn(
            "fixed z-50 p-6 flex gap-4 pointer-events-none max-h-screen overflow-hidden",
            getPositionClasses(position)
        )}>
            {displayedToasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto transition-all duration-300 ease-in-out">
                    <Toast
                        {...toast}
                        position={position}
                        containerClassName="!fixed !inset-auto !transform-none !relative !top-auto !left-auto !right-auto !bottom-auto"
                    />
                </div>
            ))}
        </div>
    );
};

export default Toast;
