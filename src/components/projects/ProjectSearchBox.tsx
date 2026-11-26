'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectSearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function ProjectSearchBox({ value, onChange, placeholder = 'Search...' }: ProjectSearchBoxProps) {
    const searchQuery = value;
    const setSearchQuery = onChange;
    const [isExpanded, setIsExpanded] = useState(searchQuery.length > 0);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when expanded
    useEffect(() => {
        if (isExpanded) {
            // Small delay to ensure input is mounted via AnimatePresence
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isExpanded]);

    const handleBlur = () => {
        setIsFocused(false);
        if (!searchQuery) {
            setIsExpanded(false);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    const showFullInput = isExpanded || isFocused || searchQuery.length > 0;

    return (
        <div className="flex items-center justify-end">
            <motion.div
                initial={false}
                animate={{
                    width: showFullInput ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 240) : 36,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 1
                }}
                className={cn(
                    "flex items-center h-9 rounded-xl border overflow-hidden shadow-sm transition-colors",
                    isFocused
                        ? "bg-white dark:bg-slate-900 border-[#091590] dark:border-blue-500 shadow-md ring-1 ring-[#091590]/10 dark:ring-blue-500/20"
                        : "bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                )}
            >
                <button
                    type="button"
                    onClick={() => {
                        setIsExpanded(true);
                        inputRef.current?.focus();
                    }}
                    className={cn(
                        "flex items-center justify-center w-9 h-9 flex-shrink-0 transition-colors",
                        isFocused ? "text-[#091590] dark:text-blue-400" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                    )}
                    aria-label="Search"
                >
                    <Search className="w-4 h-4" />
                </button>

                <div className="flex-2 relative flex items-center h-full overflow-hidden">
                    <AnimatePresence initial={false}>
                        {showFullInput && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="flex items-center w-full h-full pr-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={handleBlur}
                                    placeholder={placeholder}
                                    className="flex-1 min-w-0 h-full text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 bg-transparent border-none outline-none focus:ring-0 p-0"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="p-1 ml-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
