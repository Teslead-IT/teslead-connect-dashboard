'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Timer, Square, Clock, Play } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useOrgSwitchStore } from '@/stores/orgSwitchStore';
import { useStartTimer, useStopTimer } from '@/hooks/use-timers';
import { useSwitchOrg } from '@/hooks/use-auth';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { useOrgStore } from '@/stores/orgStore';
import { useProjectStore } from '@/stores/projectStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useProjects } from '@/hooks/use-projects';
import { useStructuredPhases } from '@/hooks/use-phases';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { StructuredTask } from '@/types/phase';

function formatDuration(startedAt: string): string {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const sec = Math.floor((now - start) / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function flattenTasks(phases: { taskLists?: { tasks?: StructuredTask[] }[] }[]): StructuredTask[] {
    const out: StructuredTask[] = [];
    const add = (tasks: StructuredTask[] | undefined) => {
        (tasks || []).forEach((t) => {
            out.push(t);
            add(t.children);
        });
    };
    phases.forEach((p) => (p.taskLists || []).forEach((tl) => add(tl.tasks)));
    return out;
}

export function GlobalTimerNav() {
    const activeTimer = useTimerStore((s) => s.activeTimer);
    const isRunning = useTimerStore((s) => s.isRunning);
    const [elapsed, setElapsed] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
    const [assignTaskOpen, setAssignTaskOpen] = useState(false);
    const [assignProjectId, setAssignProjectId] = useState('');
    const [assignTaskId, setAssignTaskId] = useState('');
    const [assignDescription, setAssignDescription] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: orgSettings } = useOrgSettings();
    const attendanceStatus = useAttendanceStore((s) => s.status);
    const requireCheckIn = (orgSettings?.requireCheckInForTimer || orgSettings?.requireAttendance) && attendanceStatus !== 'checked_in';
    const router = useRouter();
    const queryClient = useQueryClient();
    const setOrg = useOrgStore((s) => s.setOrg);
    const clearProject = useProjectStore((s) => s.clearProject);
    const setSwitching = useOrgStore((s) => s.setSwitching);
    const pendingOrgSwitch = useOrgSwitchStore((s) => s.pending);
    const clearPendingOrgSwitch = useOrgSwitchStore((s) => s.clearPending);
    const { mutate: startTimer, isPending: isStarting } = useStartTimer();
    const { mutate: stopTimer, isPending: isStopping } = useStopTimer();
    const { mutate: switchOrg } = useSwitchOrg();
    const toast = useToast();

    const { data: projectsData } = useProjects({ limit: 100 });
    const projects = useMemo(() => {
        if (!projectsData) return [];
        const raw = projectsData as { data?: { id: string; name: string }[] } | { id: string; name: string }[];
        if (Array.isArray(raw)) return raw;
        return Array.isArray(raw?.data) ? raw.data : [];
    }, [projectsData]);
    const { data: phases = [] } = useStructuredPhases(assignProjectId);
    const tasksFlat = useMemo(() => flattenTasks(phases), [phases]);

    useEffect(() => {
        if (!isRunning || !activeTimer?.startedAt) {
            setElapsed('');
            return;
        }
        const tick = () => setElapsed(formatDuration(activeTimer.startedAt));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isRunning, activeTimer?.startedAt]);

    useEffect(() => {
        if (!isRunning || !activeTimer?.startedAt) {
            document.title = 'Teslead Connect';
            return;
        }
        const label = activeTimer.taskTitle || activeTimer.projectName || 'Timer';
        const startedAt = activeTimer.startedAt;
        const updateTitle = () => {
            document.title = `Teslead Connect - ${label} (${formatDuration(startedAt)})`;
        };
        updateTitle();
        const interval = setInterval(updateTitle, 1000);
        return () => {
            clearInterval(interval);
            document.title = 'Teslead Connect';
        };
    }, [isRunning, activeTimer?.startedAt, activeTimer?.taskTitle, activeTimer?.projectName]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    useEffect(() => {
        if (pendingOrgSwitch) {
            setAssignTaskOpen(true);
            setAssignProjectId('');
            setAssignTaskId('');
            setAssignDescription('');
        }
    }, [pendingOrgSwitch]);

    const timerHasTask = activeTimer?.taskId != null;

    const handleStopClick = () => {
        if (!isRunning) return;
        if (timerHasTask) {
            setStopConfirmOpen(true);
        } else {
            setAssignTaskOpen(true);
            setAssignProjectId('');
            setAssignTaskId('');
            setAssignDescription('');
        }
    };

    const handleConfirmStop = () => {
        stopTimer(undefined, {
            onSuccess: () => {
                setStopConfirmOpen(false);
                setDropdownOpen(false);
                toast.success('Timer stopped', 'Your time has been saved.');
            },
        });
    };

    const handleAssignTaskSubmit = () => {
        if (!assignProjectId || !assignTaskId) return;
        const pending = pendingOrgSwitch;
        stopTimer(
            { projectId: assignProjectId, taskId: assignTaskId, ...(assignDescription.trim() && { description: assignDescription.trim() }) },
            {
                onSuccess: () => {
                    setAssignTaskOpen(false);
                    setDropdownOpen(false);
                    toast.success('Timer stopped', 'Your time has been saved to the task.');
                    if (pending) {
                        clearPendingOrgSwitch();
                        setOrg(pending.orgId, pending.role);
                        clearProject();
                        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
                        setSwitching(true);
                        router.replace('/dashboard');
                        switchOrg(pending.orgId);
                    }
                },
            }
        );
    };

    const handleAssignModalClose = () => {
        setAssignTaskOpen(false);
        if (pendingOrgSwitch) clearPendingOrgSwitch();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className={cn(
                    'flex items-center gap-1.5 p-2 rounded-lg transition-all active:scale-95',
                    isRunning || elapsed
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                )}
                title={requireCheckIn ? 'Check-in required to start timer' : 'Timer'}
            >
                <Timer className="w-5 h-5" />
                {(isRunning || elapsed) && (
                    <span className="text-xs font-semibold mr-1 font-mono">{elapsed}</span>
                )}
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-[40] overflow-hidden">
                    <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-semibold">Timer</span>
                        </div>
                        {isRunning && activeTimer && (
                            <p className="text-xs text-gray-600 truncate">
                                {activeTimer.taskTitle || activeTimer.projectName || (timerHasTask ? 'Task' : 'No task (assign when stopping)')}
                            </p>
                        )}
                        {isRunning ? (
                            <button
                                type="button"
                                onClick={handleStopClick}
                                disabled={isStopping}
                                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg py-2 px-3 text-xs uppercase tracking-wider disabled:opacity-50"
                            >
                                <Square className="w-3.5 h-3.5" fill="currentColor" />
                                Stop Timer
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => startTimer({})}
                                    disabled={requireCheckIn || isStarting}
                                    title={requireCheckIn ? 'Check-in required' : 'Start timer (assign task when stopping)'}
                                    className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg py-2 px-3 text-xs uppercase tracking-wider disabled:opacity-50"
                                >
                                    <Play className="w-3.5 h-3.5" fill="currentColor" />
                                    Start Timer
                                </button>
                                <p className="text-[10px] text-gray-500 text-center">
                                    Or start from a task row. Assign task when stopping.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {stopConfirmOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30" onClick={() => setStopConfirmOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-gray-900 mb-1">Stop this timer?</p>
                        <p className="text-xs text-gray-500 mb-4">Your time will be saved to the current task.</p>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setStopConfirmOpen(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="button" onClick={handleConfirmStop} disabled={isStopping} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">Stop</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {assignTaskOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30" onClick={handleAssignModalClose}>
                    <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium text-gray-900 mb-1">{pendingOrgSwitch ? 'Assign a task before switching organization' : 'Assign this time to a task'}</p>
                        <p className="text-xs text-gray-500 mb-3">{pendingOrgSwitch ? 'Your timer is running. Select a project and task to save your time, then we\'ll switch the organization.' : 'Select the project and task you were working on. Your time will be saved as a time entry.'}</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                                <select
                                    value={assignProjectId}
                                    onChange={(e) => { setAssignProjectId(e.target.value); setAssignTaskId(''); }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="">Select project</option>
                                    {Array.isArray(projects) && projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Task</label>
                                <select
                                    value={assignTaskId}
                                    onChange={(e) => setAssignTaskId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    disabled={!assignProjectId}
                                >
                                    <option value="">Select task</option>
                                    {tasksFlat.map((t) => (
                                        <option key={t.id} value={t.id}>{(t as { title?: string; name?: string }).title || (t as { title?: string; name?: string }).name || 'Untitled'}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                                <input
                                    type="text"
                                    value={assignDescription}
                                    onChange={(e) => setAssignDescription(e.target.value)}
                                    placeholder="Note"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button type="button" onClick={handleAssignModalClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="button" onClick={handleAssignTaskSubmit} disabled={isStopping || !assignProjectId || !assignTaskId} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">{pendingOrgSwitch ? 'Assign & Switch' : 'Stop & save'}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
