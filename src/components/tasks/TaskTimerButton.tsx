'use client';

import React from 'react';
import { Timer, Square } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useStartTimer, useStopTimer } from '@/hooks/use-timers';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface TaskTimerButtonProps {
    taskId: string;
    projectId: string;
    phaseId?: string;
    taskListId?: string;
    taskName?: string;
    variant?: 'icon' | 'button';
    className?: string;
    onStopSuccess?: () => void;
}

export function TaskTimerButton({ taskId, projectId, phaseId, taskListId, taskName, variant = 'icon', className, onStopSuccess }: TaskTimerButtonProps) {
    const activeTimer = useTimerStore((s) => s.activeTimer);
    const { data: orgSettings } = useOrgSettings();
    const attendanceStatus = useAttendanceStore((s) => s.status);
    const toast = useToast();
    const mustBeCheckedIn = (orgSettings?.requireCheckInForTimer || orgSettings?.requireAttendance) && attendanceStatus !== 'checked_in' && attendanceStatus !== 'on_break';

    const startTimer = useStartTimer();
    const stopTimer = useStopTimer();

    const isThisTaskRunning = activeTimer?.taskId === taskId;

    const handleStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (mustBeCheckedIn) {
            toast.warning('Check-in required', 'Please check-in to start the timer.');
            return;
        }

        const tid = toast.loading('Starting timer...');
        startTimer.mutate({
            projectId,
            taskId,
            ...(phaseId && { phaseId }),
            ...(taskListId && { taskListId }),
        }, {
            onSuccess: () => {
                toast.success('Timer started', undefined, { id: tid });
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || error.message || 'Failed to start timer';
                toast.error('Start Timer Issue', Array.isArray(message) ? message.join(', ') : message, { id: tid });
            }
        });
    };

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation();
        const tid = toast.loading('Stopping timer...');
        stopTimer.mutate(undefined, {
            onSuccess: () => {
                onStopSuccess?.();
                toast.success('Timer stopped', undefined, { id: tid });
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || error.message || 'Failed to stop timer';
                toast.error('Error stopping timer', Array.isArray(message) ? message.join(', ') : message, { id: tid });
            }
        });
    };

    if (isThisTaskRunning) {
        return variant === 'button' ? (
            <button
                type="button"
                onClick={handleStop}
                disabled={stopTimer.isPending}
                className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors',
                    className
                )}
            >
                <Square className="w-3.5 h-3.5" fill="currentColor" /> Stop Timer
            </button>
        ) : (
            <button
                type="button"
                onClick={handleStop}
                disabled={stopTimer.isPending}
                title="Stop Timer"
                className={cn('p-1 text-red-600 transition-colors', className)}
            >
                <Square className="w-3.5 h-3.5" fill="currentColor" />
            </button>
        );
    }

    const disabled = mustBeCheckedIn;
    const title = mustBeCheckedIn ? 'Check-in required' : 'Start Timer';

    return variant === 'button' ? (
        <button
            type="button"
            onClick={handleStart}
            disabled={disabled || startTimer.isPending}
            title={title}
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            <Timer className="w-3.5 h-3.5" /> Start Timer
        </button>
    ) : (
        <button
            type="button"
            onClick={handleStart}
            disabled={disabled || startTimer.isPending}
            title={title}
            className={cn(
                'p-1 text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            <Timer className="w-3.5 h-3.5" />
        </button>
    );
}
