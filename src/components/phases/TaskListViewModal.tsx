'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ListTodo, Pencil, Trash2, Save, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateTaskList, useDeleteTaskList } from '@/hooks/use-phases';
import { useToast } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists, TaskListWithTasks } from '@/types/phase';

const INSET = 20;

function countTasks(tasks: { children?: any[] }[]): number {
    return (tasks || []).reduce((s, t) => s + 1 + countTasks(t.children || []), 0);
}

interface TaskListViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    phases: PhaseWithTaskLists[];
    selectedTaskListId: string | null;
    isEditable?: boolean;
    onUpdated?: () => void;
    onDeleted?: () => void;
}

export function TaskListViewModal({
    isOpen,
    onClose,
    projectId,
    phases,
    selectedTaskListId,
    isEditable = true,
    onUpdated,
    onDeleted,
}: TaskListViewModalProps) {
    const toast = useToast();
    const [activeTaskListId, setActiveTaskListId] = useState<string | null>(selectedTaskListId);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAccess, setEditAccess] = useState<'INTERNAL' | 'CLIENT'>('INTERNAL');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

    const updateTaskListMutation = useUpdateTaskList(projectId);
    const deleteTaskListMutation = useDeleteTaskList(projectId);

    const flatTaskLists = useMemo(() => {
        const out: { taskList: TaskListWithTasks; phase: PhaseWithTaskLists }[] = [];
        phases.forEach((phase) => {
            (phase.taskLists || []).forEach((tl) => {
                out.push({ taskList: tl, phase });
            });
        });
        return out;
    }, [phases]);

    const activeEntry = flatTaskLists.find((e) => e.taskList.id === activeTaskListId);
    const activeTaskList = activeEntry?.taskList;
    const activePhase = activeEntry?.phase;

    useEffect(() => {
        if (isOpen) setActiveTaskListId(selectedTaskListId);
    }, [isOpen, selectedTaskListId]);

    useEffect(() => {
        if (activeTaskList) {
            setEditName(activeTaskList.name);
            setEditAccess(activeTaskList.access === 'CLIENT' ? 'CLIENT' : 'INTERNAL');
        }
    }, [activeTaskList]);

    useEffect(() => {
        if (!activeTaskListId && flatTaskLists.length > 0 && isOpen) setActiveTaskListId(flatTaskLists[0].taskList.id);
    }, [flatTaskLists, activeTaskListId, isOpen]);

    const handleSave = async () => {
        if (!activeTaskList) return;
        const tid = toast.loading('Saving...');
        try {
            await updateTaskListMutation.mutateAsync({
                taskListId: activeTaskList.id,
                data: { name: editName.trim(), access: editAccess },
            });
            toast.success('Task list updated', undefined, { id: tid });
            setIsEditMode(false);
            onUpdated?.();
        } catch {
            toast.error('Failed to update task list', undefined, { id: tid });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        const tid = toast.loading('Deleting...');
        try {
            await deleteTaskListMutation.mutateAsync(deleteConfirm.id);
            toast.success('Task list deleted', undefined, { id: tid });
            setDeleteConfirm(null);
            if (activeTaskListId === deleteConfirm.id) {
                const next = flatTaskLists.filter((e) => e.taskList.id !== deleteConfirm.id);
                setActiveTaskListId(next[0]?.taskList.id ?? null);
            }
            onDeleted?.();
            if (flatTaskLists.length <= 1) onClose();
        } catch {
            toast.error('Failed to delete task list', undefined, { id: tid });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />
            <div
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                style={{ top: INSET, left: INSET, right: INSET, bottom: INSET }}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Task Lists</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[280px] border-r border-gray-100 bg-gray-50/50 flex flex-col flex-shrink-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {flatTaskLists.map(({ taskList, phase }) => {
                                const isActive = activeTaskListId === taskList.id;
                                const taskCount = countTasks(taskList.tasks || []);
                                return (
                                    <button
                                        key={taskList.id}
                                        type="button"
                                        onClick={() => { setActiveTaskListId(taskList.id); setIsEditMode(false); }}
                                        className={cn(
                                            'w-full text-left rounded-lg px-3 py-2.5 transition-all border',
                                            isActive
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                                        )}
                                    >
                                        <div className="font-semibold text-sm truncate">{taskList.name}</div>
                                        <div className={cn('text-[10px] mt-0.5 flex items-center gap-1', isActive ? 'text-white/80' : 'text-gray-500')}>
                                            <Layers className="w-3 h-3" />
                                            {phase.name} · {taskCount} task(s)
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {activeTaskList ? (
                            <div className="p-6 space-y-5">
                                {/* Top action bar - same as task modal */}
                                {isEditable && (
                                    <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                        {isEditMode ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleSave}
                                                    disabled={!editName.trim() || updateTaskListMutation.isPending}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#091590] hover:bg-[#071170] disabled:opacity-50 transition-colors rounded"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {updateTaskListMutation.isPending ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditMode(false)}
                                                    disabled={updateTaskListMutation.isPending}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditMode(true)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors rounded"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteConfirm({ id: activeTaskList.id, name: activeTaskList.name })}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                                    {isEditMode ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded"
                                            placeholder="Task list name"
                                        />
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{activeTaskList.name}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phase</label>
                                    <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded flex items-center gap-2">
                                        {activePhase && <><Layers className="w-3.5 h-3.5 text-gray-500" />{activePhase.name}</>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Access</label>
                                    {isEditMode ? (
                                        <select
                                            value={editAccess}
                                            onChange={(e) => setEditAccess(e.target.value as 'INTERNAL' | 'CLIENT')}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded cursor-pointer"
                                        >
                                            <option value="INTERNAL">Internal</option>
                                            <option value="CLIENT">Client</option>
                                        </select>
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{activeTaskList.access || 'INTERNAL'}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tasks</label>
                                    <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{countTasks(activeTaskList.tasks || [])} task(s) in this list</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <ListTodo className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium">Select a task list</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                type="warning"
                title="Delete Task List"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? All tasks in this list will be affected.`}
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={deleteTaskListMutation.isPending}
            />
        </>
    );
}
