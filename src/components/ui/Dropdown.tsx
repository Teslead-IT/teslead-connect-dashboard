'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    label?: string;
    error?: string;
    customTrigger?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    label,
    error,
    customTrigger,
    size = 'md',
    disabled = false
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const sizeClasses = {
        sm: 'px-2 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base',
    };

    return (
        <div ref={dropdownRef} className={cn('relative inline-block w-full', className)}>
            {label && (
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">
                    {label}
                </label>
            )}

            {customTrigger ? (
                <div onClick={() => !disabled && setIsOpen(!isOpen)} className={cn(disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                    {customTrigger}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'w-full flex items-center justify-between gap-2 rounded-lg transition-all duration-200',
                        'bg-white border text-left',
                        isOpen
                            ? 'border-[#091590] ring-4 ring-[#091590]/10'
                            : 'border-gray-200 hover:border-gray-300',
                        error ? 'border-red-500 ring-red-500/10' : '',
                        disabled ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-80' : 'text-gray-900',
                        sizeClasses[size],
                        'font-medium focus:outline-none'
                    )}
                >
                    <span className="flex items-center gap-2.5 truncate">
                        {selectedOption?.icon && (
                            <span className="flex-shrink-0 text-gray-400 group-hover:text-[#091590] transition-colors">
                                {selectedOption.icon}
                            </span>
                        )}
                        <span className={cn(
                            'truncate',
                            !selectedOption && 'text-gray-400 font-normal'
                        )}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </span>
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0',
                            isOpen && 'rotate-180 text-[#091590]'
                        )}
                    />
                </button>
            )}

            {error && <p className="mt-1 text-[10px] text-red-500 font-medium ml-1">{error}</p>}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            'absolute z-[110] mt-2.5 w-[calc(100%+12px)] -left-[6px] rounded-xl',
                            'bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)]',
                            'max-h-64 overflow-y-auto custom-scrollbar'
                        )}
                    >
                        <div className="p-1.5">
                            {options.map((option) => {
                                const isSelected = value === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            'w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left rounded-lg',
                                            'transition-all duration-150',
                                            isSelected
                                                ? 'bg-blue-50 text-[#091590] font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        )}
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            {option.icon && (
                                                <span className={cn(
                                                    'flex-shrink-0',
                                                    isSelected ? 'text-[#091590]' : 'text-gray-400'
                                                )}>
                                                    {option.icon}
                                                </span>
                                            )}
                                            <span className="truncate">{option.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[#091590]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
