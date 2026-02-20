'use client';

import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function ProjectSearchBox({ value, onChange, placeholder = 'Search...' }: ProjectSearchBoxProps) {
    const searchQuery = value;
    const setSearchQuery = onChange;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const showFullInput = isExpanded || isFocused || searchQuery.length > 0;

    const handleBlur = () => {
        setIsFocused(false);
        if (!searchQuery) setIsExpanded(false);
    };

    const handleClear = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    return (
        <div
            className={cn(
                "flex items-center h-8 rounded-md border border-gray-200 bg-gray-50 transition-all duration-200 overflow-hidden",
                showFullInput ? "w-[200px] min-w-[200px] sm:w-[220px]" : "w-8 min-w-8"
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => { if (!searchQuery) setIsExpanded(false); }}
        >
            <button
                type="button"
                onClick={() => {
                    if (!showFullInput) setIsExpanded(true);
                    inputRef.current?.focus();
                }}
                className="flex items-center justify-center w-8 h-8 flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Search"
            >
                <Search className="w-4 h-4" />
            </button>
            <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onMouseEnter={() => setIsExpanded(true)}
                placeholder={placeholder}
                className={cn(
                    "flex-1 min-w-0 h-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent",
                    "border-none outline-none focus:ring-0",
                    showFullInput ? "opacity-100 w-[140px]" : "opacity-0 w-0 p-0"
                )}
                style={showFullInput ? {} : { width: 0, padding: 0, margin: 0, minWidth: 0 }}
            />
            {searchQuery && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center justify-center w-6 h-6 mr-1 flex-shrink-0 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    aria-label="Clear search"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
