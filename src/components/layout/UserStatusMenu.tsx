'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const statusOptions = [
    { label: 'Active', color: 'bg-green-500' },
    { label: 'Inactive', color: 'bg-gray-400' },
    { label: 'Check In', color: 'bg-blue-500' },
    { label: 'Check Out', color: 'bg-red-500' },
    { label: 'Lunch', color: 'bg-orange-500' },
    { label: 'Break', color: 'bg-yellow-500' },
];

export function UserStatusMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(statusOptions[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-[128px] flex items-center justify-between px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all active:scale-95 shadow-sm"
                title="Update Status"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${currentStatus.color} flex-shrink-0`} />
                    <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{currentStatus.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            <div
                className={`absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[40] transition-all duration-200 ease-out origin-top-right transform ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div className="py-1">
                    {statusOptions.map((status) => (
                        <button
                            key={status.label}
                            onClick={() => {
                                setCurrentStatus(status);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors hover:bg-gray-50
                                ${currentStatus.label === status.label ? 'bg-gray-50/80 font-semibold' : 'text-gray-600 font-medium'}
                            `}
                        >
                            <span className={`w-2 h-2 rounded-full ${status.color}`} />
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
