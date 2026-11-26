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
import { useTimerStore } from '@/stores/timerStore';
import { Dialog } from '@/components/ui/Dialog';

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
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const status = useAttendanceStore((s) => s.status);
    const isTimerRunning = useTimerStore((s) => s.isRunning);
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

    const handleCheckOutClick = () => {
        if (isTimerRunning) {
            setShowCheckoutConfirm(true);
        } else {
            checkOut.mutate();
        }
        setIsOpen(false);
    };

    const confirmCheckOut = async () => {
        await checkOut.mutateAsync();
        setShowCheckoutConfirm(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-[140px] flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg transition-all active:scale-95 shadow-sm"
                title="Attendance"
            >
                <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.color)} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 whitespace-nowrap truncate">{config.label}</span>
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 dark:text-slate-400 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
            </button>

            <div
                className={cn(
                    'absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-[40] transition-all duration-200 origin-top-right',
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
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
                                >
                                    <LogIn className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    Check In
                                    <ChevronDown className="w-3 h-3 ml-auto rotate-[-90deg] text-gray-400 dark:text-slate-400" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setCheckInSubmenu(false)}
                                        className="w-full flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-800"
                                    >
                                        ← Back
                                    </button>
                                    {WORK_MODE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleCheckIn(opt.value)}
                                            disabled={checkIn.isPending}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors disabled:opacity-50"
                                        >
                                            <span className="text-gray-500 dark:text-slate-400">{opt.icon}</span>
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
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50"
                            >
                                <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                Start Lunch
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStartBreak('BREAK')}
                                disabled={startBreak.isPending}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50"
                            >
                                <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                Start Break
                            </button>
                        </>
                    )}
                    {showEndBreakOption && (
                        <button
                            type="button"
                            onClick={() => { endBreak.mutate(); setIsOpen(false); }}
                            disabled={endBreak.isPending}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50"
                        >
                            <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            End Break
                        </button>
                    )}
                    {(status === 'checked_in' || status === 'on_break' || status === 'on_lunch') && (
                        <button
                            type="button"
                            onClick={handleCheckOutClick}
                            disabled={checkOut.isPending}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 border-t border-gray-100 dark:border-slate-800"
                        >
                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                            Check Out
                        </button>
                    )}
                </div>
            </div>

            <Dialog
                isOpen={showCheckoutConfirm}
                onClose={() => setShowCheckoutConfirm(false)}
                type="warning"
                title="Active Timer Running"
                message="You have an active timer running. Checking out will automatically stop the timer and save your progress. Proceed?"
                confirmText="Stop Timer & Check Out"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={confirmCheckOut}
                isLoading={checkOut.isPending}
            />
        </div>
    );
}
