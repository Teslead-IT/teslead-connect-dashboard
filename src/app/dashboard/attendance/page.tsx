'use client';

import React from 'react';
import { useAttendanceToday } from '@/hooks/use-attendance';
import { useOrgStore } from '@/stores/orgStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { Loader } from '@/components/ui/Loader';
import { Clock, LogIn, LogOut, Coffee } from 'lucide-react';

function formatTime(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return '—';
    }
}

export default function AttendancePage() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const { data, isLoading } = useAttendanceToday();
    const status = useAttendanceStore((s) => s.status);
    const sessionStart = useAttendanceStore((s) => s.sessionStart);
    const breakStart = useAttendanceStore((s) => s.breakStart);
    const lunchStart = useAttendanceStore((s) => s.lunchStart);
    const checkedOutAt = useAttendanceStore((s) => s.checkedOutAt);

    if (!activeOrgId) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <p className="text-gray-500 text-center">Select an organization to view attendance.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-12 flex justify-center">
                <Loader className="w-8 h-8 text-gray-400" />
            </div>
        );
    }

    const displayStatus = status ?? (data as { status?: string })?.status ?? 'not_checked_in';

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance</h1>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Today</h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`
                                flex items-center justify-center w-12 h-12 rounded-full
                                ${displayStatus === 'checked_in' ? 'bg-green-100 text-green-600' : ''}
                                ${displayStatus === 'on_break' ? 'bg-amber-100 text-amber-600' : ''}
                                ${displayStatus === 'on_lunch' ? 'bg-amber-100 text-amber-600' : ''}
                                ${displayStatus === 'checked_out' ? 'bg-gray-100 text-gray-600' : ''}
                                ${displayStatus === 'not_checked_in' ? 'bg-gray-100 text-gray-400' : ''}
                            `}>
                                {displayStatus === 'checked_in' && <LogIn className="w-6 h-6" />}
                                {(displayStatus === 'on_break' || displayStatus === 'on_lunch') && <Coffee className="w-6 h-6" />}
                                {displayStatus === 'checked_out' && <LogOut className="w-6 h-6" />}
                                {displayStatus === 'not_checked_in' && <Clock className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900">
                                    {displayStatus === 'checked_in' && 'Checked In'}
                                    {displayStatus === 'on_break' && 'On Break'}
                                    {displayStatus === 'on_lunch' && 'On Lunch'}
                                    {displayStatus === 'checked_out' && 'Checked Out'}
                                    {displayStatus === 'not_checked_in' && 'Not Checked In'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {displayStatus === 'checked_in' && sessionStart && `Since ${formatTime(sessionStart)}`}
                                    {(displayStatus === 'on_break' || displayStatus === 'on_lunch') && (breakStart || lunchStart) && `Since ${formatTime(breakStart ?? lunchStart ?? undefined)}`}
                                    {displayStatus === 'checked_out' && 'Session ended'}
                                    {displayStatus === 'not_checked_in' && 'Check in from the top navigation'}
                                </p>
                            </div>
                        </div>

                        {(displayStatus === 'checked_in' || displayStatus === 'on_break' || displayStatus === 'on_lunch' || displayStatus === 'checked_out') && sessionStart && (
                            <div className="pt-4 border-t border-gray-100 grid gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Check-in</span>
                                    <span className="font-medium">{formatTime(sessionStart)}</span>
                                </div>
                                {displayStatus === 'checked_out' && checkedOutAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Check-out</span>
                                        <span className="font-medium">{formatTime(checkedOutAt)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-500">
                    Use the attendance menu in the top navigation to check in, start/end breaks, and check out.
                </p>
            </div>
        </div>
    );
}
