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
    customTrigger?: React.ReactNode;
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', className, customTrigger }: DropdownProps) {
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
            {customTrigger ? (
                <div onClick={() => setIsOpen(!isOpen)}>{customTrigger}</div>
            ) : (
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
            )}

            {isOpen && (
                <div
                    className={cn(
                        'fixed z-[100] mt-1 rounded-lg right-auto',
                        'bg-white border border-gray-200',
                        'shadow-xl min-w-[160px] max-h-60 overflow-auto',
                        'animate-in fade-in zoom-in-95 duration-150'
                    )}
                    style={{
                        top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
                        left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().right - 160 + window.scrollX : 0,
                    }}
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
                                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                                'text-gray-700 hover:bg-gray-50',
                                'transition-colors first:rounded-t-lg last:rounded-b-lg',
                                value === option.value && 'bg-gray-100 font-medium'
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
