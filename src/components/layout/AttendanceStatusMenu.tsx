'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogIn, LogOut, Coffee, Building2, Home, Laptop, Utensils } from 'lucide-react';
import { useAttendanceStore } from '@/stores/attendanceStore';
import {
    useAttendanceCheckIn,
    useAttendanceCheckOut,
    useAttendanceStartBreak,
    useAttendanceEndBreak,
} from '@/hooks/use-attendance';
import type { WorkMode, BreakType } from '@/types/attendance';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
    not_checked_in: { label: 'Not checked in', color: 'bg-gray-400' },
    checked_in: { label: 'Checked in', color: 'bg-green-500' },
    on_break: { label: 'On break', color: 'bg-yellow-500' },
    on_lunch: { label: 'On lunch', color: 'bg-amber-500' },
    checked_out: { label: 'Checked out', color: 'bg-gray-400' },
};

const WORK_MODE_OPTIONS: { value: WorkMode; label: string; icon: React.ReactNode }[] = [
    { value: 'OFFICE', label: 'Office', icon: <Building2 className="w-4 h-4" /> },
    { value: 'WFH', label: 'Work from home', icon: <Home className="w-4 h-4" /> },
    { value: 'REMOTE', label: 'Remote', icon: <Laptop className="w-4 h-4" /> },
];

export function AttendanceStatusMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [checkInSubmenu, setCheckInSubmenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const status = useAttendanceStore((s) => s.status);
    const config = statusConfig[status] || statusConfig.not_checked_in;

    const checkIn = useAttendanceCheckIn();
    const checkOut = useAttendanceCheckOut();
    const startBreak = useAttendanceStartBreak();
    const endBreak = useAttendanceEndBreak();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setCheckInSubmenu(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const showStartBreakOptions = status === 'checked_in';
    const showEndBreakOption = status === 'on_break' || status === 'on_lunch';

    const handleCheckIn = (workMode: WorkMode) => {
        checkIn.mutate({ workMode });
        setCheckInSubmenu(false);
        setIsOpen(false);
    };

    const handleStartBreak = (type: BreakType) => {
        startBreak.mutate({ type });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-[140px] flex items-center justify-between px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all active:scale-95 shadow-sm"
                title="Attendance"
            >
                <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.color)} />
                    <span className="text-xs font-semibold text-gray-700 whitespace-nowrap truncate">{config.label}</span>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
            </button>

            <div
                className={cn(
                    'absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[40] transition-all duration-200 origin-top-right',
                    isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                )}
            >
                <div className="py-1">
                    {(status === 'not_checked_in' || status === 'checked_out') && (
                        <>
                            {!checkInSubmenu ? (
                                <button
                                    type="button"
                                    onClick={() => setCheckInSubmenu(true)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-green-50 transition-colors"
                                >
                                    <LogIn className="w-4 h-4 text-green-600" />
                                    Check In
                                    <ChevronDown className="w-3 h-3 ml-auto rotate-[-90deg]" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setCheckInSubmenu(false)}
                                        className="w-full flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        ← Back
                                    </button>
                                    {WORK_MODE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleCheckIn(opt.value)}
                                            disabled={checkIn.isPending}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                    {showStartBreakOptions && (
                        <>
                            <button
                                type="button"
                                onClick={() => handleStartBreak('LUNCH')}
                                disabled={startBreak.isPending}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                                <Utensils className="w-4 h-4 text-amber-600" />
                                Start Lunch
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStartBreak('BREAK')}
                                disabled={startBreak.isPending}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                                <Coffee className="w-4 h-4 text-amber-600" />
                                Start Break
                            </button>
                        </>
                    )}
                    {showEndBreakOption && (
                        <button
                            type="button"
                            onClick={() => { endBreak.mutate(); setIsOpen(false); }}
                            disabled={endBreak.isPending}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                            <Coffee className="w-4 h-4 text-amber-600" />
                            End Break
                        </button>
                    )}
                    {(status === 'checked_in' || status === 'on_break' || status === 'on_lunch') && (
                        <button
                            type="button"
                            onClick={() => { checkOut.mutate(); setIsOpen(false); }}
                            disabled={checkOut.isPending}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 transition-colors disabled:opacity-50 border-t border-gray-100"
                        >
                            <LogOut className="w-4 h-4 text-red-600" />
                            Check Out
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
