import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
    const baseStyles =
        'inline-flex items-center justify-center rounded-full font-medium transition-colors';

    const variantStyles = {
        default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
        success: 'bg-green-500/10 text-green-600 dark:text-green-400',
        warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
    };

    return (
        <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
            {children}
        </span>
    );
}
