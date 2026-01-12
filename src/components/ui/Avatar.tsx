import React from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps {
    name: string;
    src?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
    const sizeStyles = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
    };

    const initials = getInitials(name);

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-medium overflow-hidden',
                'bg-gradient-to-br from-blue-500 to-purple-500 text-white',
                sizeStyles[size],
                className
            )}
            title={name}
        >
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
