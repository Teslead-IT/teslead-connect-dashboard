'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListTodo, Pencil, Trash2, Save, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateTaskList, useDeleteTaskList } from '@/hooks/use-phases';
import { useProject } from '@/hooks/use-projects';
import { useToast } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists, TaskListWithTasks } from '@/types/phase';

const INSET = 20;
const ROUNDED = 'rounded';
const ROUNDED_MD = 'rounded-md';
const ROUNDED_LG = 'rounded-lg';
const ANIM_DURATION = 0.25;

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
    const { data: project } = useProject(projectId);
    const [activeTaskListId, setActiveTaskListId] = useState<string | null>(selectedTaskListId);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAccess, setEditAccess] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
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
            setEditAccess(activeTaskList.access === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="task-list-view-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: ANIM_DURATION }}
                    className="fixed inset-0 z-[9998]"
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: ANIM_DURATION, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={cn("absolute z-10 bg-white shadow-2xl overflow-hidden flex flex-col", ROUNDED_LG)}
                        style={{ top: INSET, left: INSET, right: INSET, bottom: INSET }}
                    >
                        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 bg-gradient-to-br from-[#091590] to-[#2563eb] flex items-center justify-center shadow-md", ROUNDED)}>
                                    <ListTodo className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-2 overflow-hidden mr-4">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm whitespace-nowrap">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter leading-none">{project?.name || 'Project'}</span>
                                    </div>
                                    <span className="text-gray-300 text-[10px] font-medium">&gt;</span>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded shadow-sm whitespace-nowrap">
                                        <Layers className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[9px] font-medium text-indigo-500 uppercase tracking-tighter leading-none">{activePhase?.name || 'Phase'}</span>
                                    </div>
                                    <span className="text-gray-300 text-[10px] font-medium">&gt;</span>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded shadow-sm whitespace-nowrap">
                                        <ListTodo className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[9px] font-medium text-emerald-500 uppercase tracking-tighter leading-none">Task Lists</span>
                                    </div>
                                    <span className="text-gray-300 text-[10px] font-medium">&gt;</span>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none truncate uppercase">{activeTaskList?.name || 'Select List'}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={cn("w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors", ROUNDED)}
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
                                                    'w-full text-left p-3 transition-all border outline-none',
                                                    ROUNDED,
                                                    isActive
                                                        ? 'bg-[#10b981] text-white border-[#10b981] shadow-sm'
                                                        : 'bg-white border-gray-100 hover:border-emerald-200 text-gray-900'
                                                )}
                                            >
                                                <div className="font-bold text-sm truncate">{taskList.name}</div>
                                                <div className={cn('text-[10px] mt-1 flex items-center gap-1.5', isActive ? 'text-white/70' : 'text-gray-400')}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white/70" : "bg-emerald-400")} />
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
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#091590] hover:bg-[#071170] disabled:opacity-50 transition-colors", ROUNDED)}
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            {updateTaskListMutation.isPending ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditMode(false)}
                                                            disabled={updateTaskListMutation.isPending}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors", ROUNDED)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditMode(true)}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors", ROUNDED)}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirm({ id: activeTaskList.id, name: activeTaskList.name })}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors", ROUNDED)}
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
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]", ROUNDED)}
                                                    placeholder="Task list name"
                                                />
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>{activeTaskList.name}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phase</label>
                                            <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>
                                                {activePhase && <div className="flex items-center gap-2 font-medium text-indigo-600"><Layers className="w-3.5 h-3.5" />{activePhase.name}</div>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Access</label>
                                            {isEditMode ? (
                                                <select
                                                    value={editAccess}
                                                    onChange={(e) => setEditAccess(e.target.value as 'PUBLIC' | 'PRIVATE')}
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] cursor-pointer", ROUNDED)}
                                                >
                                                    <option value="PRIVATE">Private</option>
                                                    <option value="PUBLIC">Public</option>
                                                </select>
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>{activeTaskList.access || 'PRIVATE'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tasks</label>
                                            <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>{countTasks(activeTaskList.tasks || [])} task(s) in this list</div>
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
                    </motion.div>
                </motion.div>
            )}

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
        </AnimatePresence>
    );
}
