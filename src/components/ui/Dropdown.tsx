'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

export interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', className }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className={cn('relative inline-block', className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
                    'bg-[var(--color-surface)] border border-[var(--color-border-primary)]',
                    'text-[var(--color-text-primary)] hover:border-[var(--color-border-secondary)]',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]'
                )}
            >
                <span className="flex items-center gap-2">
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 w-full mt-1 rounded-lg',
                        'bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]',
                        'shadow-lg max-h-60 overflow-auto'
                    )}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-left',
                                'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
                                'transition-colors first:rounded-t-lg last:rounded-b-lg',
                                value === option.value && 'bg-[var(--color-bg-tertiary)]'
                            )}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
