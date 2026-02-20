'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ListTodo,
    Calendar,
    User,
    Tag,
    Flag,
    AlignLeft,
    Pencil,
    Trash2,
    Save,
    CheckCircle2,
    Users,
    Search,
    Check,
} from 'lucide-react';
import { cn, getAvatarColor } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists } from '@/types/phase';
import type { StructuredTask } from '@/types/phase';
import type { CreateTaskPayload, TaskPriority, WorkflowStage } from '@/types/task';
import type { ProjectMember } from '@/types/project';

interface TaskViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    phases: PhaseWithTaskLists[];
    selectedTaskId?: string | null;
    startInEditMode?: boolean;
    isEditable?: boolean;
    workflow: WorkflowStage[];
    members?: ProjectMember[];
    onUpdateTask?: (taskId: string, data: Partial<CreateTaskPayload>) => Promise<void>;
    onDeleteTask?: (taskId: string) => Promise<void>;
    onTaskUpdated?: () => void;
    onTaskDeleted?: (taskId: string) => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; bg: string }[] = [
    { value: 1, label: 'Lowest', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
    { value: 2, label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { value: 3, label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    { value: 4, label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { value: 5, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
];

const ANIM_DURATION = 0.25;
const ROUNDED = 'rounded'; // reduced border radius
const ROUNDED_MD = 'rounded-md';

export function TaskViewModal({
    isOpen,
    onClose,
    projectId,
    phases,
    selectedTaskId = null,
    startInEditMode = false,
    isEditable = true,
    workflow = [],
    members = [],
    onUpdateTask,
    onDeleteTask,
    onTaskUpdated,
    onTaskDeleted,
}: TaskViewModalProps) {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(selectedTaskId);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ taskId: string; name: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { taskListGroups, allTasksFlat } = useMemo(() => {
        const allGroups: { phase: PhaseWithTaskLists; taskList: { id: string; name: string }; tasks: StructuredTask[] }[] = [];
        phases.forEach((phase) => {
            (phase.taskLists || []).forEach((taskList) => {
                const tasks = taskList.tasks || [];
                const flattenTasks = (items: StructuredTask[]): StructuredTask[] =>
                    items.flatMap((t) => [t, ...flattenTasks(t.children || [])]);
                const allTasks = flattenTasks(tasks);
                if (allTasks.length > 0) {
                    allGroups.push({ phase, taskList, tasks: allTasks });
                }
            });
        });
        const allFlat = allGroups.flatMap((g) => g.tasks);
        const taskIdForPhase = activeTaskId || selectedTaskId;
        const phaseId = taskIdForPhase ? allGroups.find((g) => g.tasks.some((t) => t.id === taskIdForPhase))?.phase.id ?? null : null;
        const groups = phaseId ? allGroups.filter((g) => g.phase.id === phaseId) : allGroups;
        return { taskListGroups: groups, allTasksFlat: groups.flatMap((g) => g.tasks) };
    }, [phases, activeTaskId, selectedTaskId]);
    const activeTask = useMemo(() => allTasksFlat.find((t) => t.id === activeTaskId), [allTasksFlat, activeTaskId]);

    const activeTaskListId = useMemo(() => {
        if (!activeTaskId) return null;
        const group = taskListGroups.find((g) => g.tasks.some((t) => t.id === activeTaskId));
        return group?.taskList.id ?? null;
    }, [activeTaskId, taskListGroups]);

    useEffect(() => {
        if (isOpen) {
            setActiveTaskId(selectedTaskId);
            setIsEditMode(!!startInEditMode);
            setError(null);
        }
    }, [isOpen, selectedTaskId, startInEditMode]);

    useEffect(() => {
        if (!activeTaskId && allTasksFlat.length > 0 && isOpen) {
            setActiveTaskId(allTasksFlat[0].id);
        }
    }, [allTasksFlat, activeTaskId, isOpen]);

    const getHeaderTitle = (): string => {
        if (activeTask) return activeTask.title || 'Untitled Task';
        return 'Select a Task';
    };

    const handleClose = () => onClose();

    const handleSave = async (formData: CreateTaskPayload) => {
        if (!activeTaskId || !onUpdateTask) return;
        setIsSaving(true);
        setError(null);
        try {
            const { taskListId: _, phaseId: __, ...updateData } = formData;
            await onUpdateTask(activeTaskId, updateData);
            setIsEditMode(false);
            onTaskUpdated?.();
        } catch (e: any) {
            setError(e?.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm || !onDeleteTask) return;
        setIsDeleting(true);
        try {
            await onDeleteTask(deleteConfirm.taskId);
            setDeleteConfirm(null);
            const idx = allTasksFlat.findIndex((t) => t.id === deleteConfirm.taskId);
            const nextTask = idx > 0 ? allTasksFlat[idx - 1] : allTasksFlat[idx + 1];
            setActiveTaskId(nextTask?.id ?? null);
            onTaskDeleted?.(deleteConfirm.taskId);
            if (allTasksFlat.length <= 1) onClose();
        } catch {
            setError('Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    const canEdit = isEditable && !!onUpdateTask && !!activeTaskListId;
    const canDelete = isEditable && !!onDeleteTask;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="task-view-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: ANIM_DURATION }}
                    className="fixed inset-0 z-[9998]"
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: ANIM_DURATION, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={cn("absolute z-10 bg-white shadow-2xl overflow-hidden flex flex-col", ROUNDED_MD)}
                        style={{ top: 20, left: 20, right: 20, bottom: 20 }}
                    >
                        {/* Top Bar */}
                        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 bg-gradient-to-br from-[#091590] to-[#2563eb] flex items-center justify-center shadow-md", ROUNDED)}>
                                    <ListTodo className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{getHeaderTitle()}</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className={cn("w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors", ROUNDED)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Panel */}
                            <div className="w-[300px] border-r border-gray-100 bg-gray-50/50 flex flex-col flex-shrink-0">
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {taskListGroups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                            <ListTodo className="w-10 h-10 text-gray-200 mb-3" />
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No tasks</p>
                                        </div>
                                    ) : (
                                        taskListGroups.map(({ phase, taskList, tasks }) => (
                                            <div key={taskList.id} className="space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate px-2">
                                                    {phase.name} / {taskList.name}
                                                </p>
                                                <div className="space-y-1.5">
                                                    {tasks.map((task) => {
                                                        const isActive = activeTaskId === task.id;
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => { setActiveTaskId(task.id); setIsEditMode(false); }}
                                                                className={cn(
                                                                    "relative p-3 cursor-pointer transition-all border",
                                                                    ROUNDED,
                                                                    isActive ? "bg-[#091590] text-white border-[#091590]" : "bg-white text-gray-900 border-gray-100 hover:border-blue-200"
                                                                )}
                                                            >
                                                                <h3 className={cn("font-bold text-sm truncate", isActive ? "text-white" : "text-gray-900")}>
                                                                    {task.title || 'Untitled'}
                                                                </h3>
                                                                <div className={cn("flex items-center gap-2 mt-1.5", isActive ? "text-white/70" : "text-gray-400")}>
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : task.status?.color || '#64748b' }} />
                                                                    <span className="text-[10px] font-bold uppercase">{task.status?.name || 'No status'}</span>
                                                                </div>
                                                                {task.dueDate && (
                                                                    <p className={cn("text-[10px] mt-1 flex items-center gap-1", isActive ? "text-white/60" : "text-gray-400")}>
                                                                        <Calendar className="w-3 h-3" />
                                                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {taskListGroups.length > 0 && (
                                    <div className="px-3 py-2 border-t border-gray-100 bg-white">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                            {allTasksFlat.length} task{allTasksFlat.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel */}
                            <div className="flex-1 overflow-auto">
                                {activeTask ? (
                                    isEditMode ? (
                                        <TaskEditForm
                                            task={activeTask}
                                            taskListId={activeTaskListId!}
                                            workflow={workflow}
                                            members={members}
                                            onSave={handleSave}
                                            onCancel={() => setIsEditMode(false)}
                                            isSaving={isSaving}
                                            error={error}
                                            rounded={ROUNDED}
                                            roundedMd={ROUNDED_MD}
                                        />
                                    ) : (
                                        <TaskDetailsPanel
                                            task={activeTask}
                                            canEdit={canEdit}
                                            canDelete={canDelete}
                                            onEdit={() => setIsEditMode(true)}
                                            onDelete={() => activeTask && setDeleteConfirm({ taskId: activeTask.id, name: activeTask.title || 'Untitled' })}
                                            rounded={ROUNDED}
                                            roundedMd={ROUNDED_MD}
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <ListTodo className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-gray-400 uppercase">Select a task</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <Dialog
                isOpen={!!deleteConfirm}
                onClose={() => !isDeleting && setDeleteConfirm(null)}
                type="warning"
                title="Delete Task"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
                description="This action cannot be undone."
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AnimatePresence>
    );
}

function TaskDetailsPanel({
    task,
    canEdit,
    canDelete,
    onEdit,
    onDelete,
    rounded,
    roundedMd,
}: {
    task: StructuredTask;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
    rounded: string;
    roundedMd: string;
}) {
    const PRIORITY_LABELS: Record<number, string> = { 1: 'Lowest', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical' };
    const showActions = canEdit || canDelete;

    const fieldClasses = `px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm ${rounded}`;
    const labelClasses = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

    return (
        <div className="p-6 space-y-5">
            {showActions && (
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                    {canEdit && (
                        <button onClick={onEdit} className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors", rounded)}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={onDelete} className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors", rounded)}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    )}
                </div>
            )}
            <div>
                <label className={labelClasses}>Title</label>
                <div className={fieldClasses}>{task.title || 'Untitled'}</div>
            </div>
            {task.description && (
                <div>
                    <label className={cn(labelClasses, "flex items-center gap-2")}><AlignLeft className="w-3 h-3" /> Description</label>
                    <div className={cn(fieldClasses, "whitespace-pre-wrap")}>{task.description}</div>
                </div>
            )}
            <div>
                <label className={labelClasses}>Status</label>
                <div className={cn("inline-flex items-center gap-2 px-3 py-2 border bg-white", rounded)}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.status?.color || '#64748b' }} />
                    <span className="text-sm font-medium">{task.status?.name || 'No status'}</span>
                </div>
            </div>
            <div>
                <label className={cn(labelClasses, "flex items-center gap-2")}><Flag className="w-3 h-3" /> Priority</label>
                <div className={fieldClasses}>{PRIORITY_LABELS[task.priority] ?? `Priority ${task.priority}`}</div>
            </div>
            {task.dueDate && (
                <div>
                    <label className={cn(labelClasses, "flex items-center gap-2")}><Calendar className="w-3 h-3" /> Due Date</label>
                    <div className={fieldClasses}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            )}
            <div>
                <label className={cn(labelClasses, "flex items-center gap-2")}><User className="w-3 h-3" /> Assignees</label>
                <div className="flex flex-wrap gap-2">
                    {(task.assignees || []).length === 0 ? (
                        <span className="text-sm text-gray-400">No assignees</span>
                    ) : (
                        (task.assignees || []).map((a) => (
                            <span key={a.id} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium", rounded)}>
                                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold", getAvatarColor(a.name || '?'))}>
                                    {(a.name || '?').charAt(0).toUpperCase()}
                                </span>
                                {a.name || 'Unknown'}
                            </span>
                        ))
                    )}
                </div>
            </div>
            {task.tags && task.tags.length > 0 && (
                <div>
                    <label className={cn(labelClasses, "flex items-center gap-2")}><Tag className="w-3 h-3" /> Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag) => (
                            <span key={tag.id} className={cn("inline-flex px-2.5 py-1 text-xs font-medium border", rounded)} style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskEditForm({
    task,
    taskListId,
    workflow,
    members,
    onSave,
    onCancel,
    isSaving,
    error,
    rounded,
    roundedMd,
}: {
    task: StructuredTask;
    taskListId: string;
    workflow: WorkflowStage[];
    members: ProjectMember[];
    onSave: (data: CreateTaskPayload) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
    error: string | null;
    rounded: string;
    roundedMd: string;
}) {
    const [formData, setFormData] = useState<CreateTaskPayload>({
        title: task.title,
        description: task.description || '',
        priority: task.priority as TaskPriority,
        statusId: task.status?.id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeIds: task.assignees?.map((a: any) => a.userId || a.user?.id || a.id) || [],
        parentId: task.parentId,
        taskListId,
        phaseId: '',
    });
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const allStatuses = useMemo(() => workflow.flatMap((s) => s.statuses.map((st) => ({ ...st, stageName: s.name }))), [workflow]);
    const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === formData.priority) || PRIORITY_OPTIONS[2];
    const currentStatus = allStatuses.find((s) => s.id === formData.statusId);
    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return members;
        const q = assigneeSearch.toLowerCase();
        return members.filter((m) => m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q));
    }, [members, assigneeSearch]);
    const selectedMembers = useMemo(() => members.filter((m) => formData.assigneeIds?.includes(m.user.id)), [members, formData.assigneeIds]);

    useEffect(() => {
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority as TaskPriority,
            statusId: task.status?.id || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            assigneeIds: task.assignees?.map((a: any) => a.userId || a.user?.id || a.id) || [],
            parentId: task.parentId,
            taskListId,
            phaseId: '',
        });
    }, [task.id, taskListId]);

    const toggleAssignee = (userId: string) => {
        setFormData((prev) => {
            const current = prev.assigneeIds || [];
            const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
            return { ...prev, assigneeIds: next };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) return;
        onSave(formData);
    };

    const inputClass = `w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] ${rounded}`;

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                <button type="submit" disabled={isSaving || !formData.title?.trim()} className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#091590] hover:bg-[#071170] disabled:opacity-50 transition-colors", rounded)}>
                    <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={onCancel} disabled={isSaving} className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors", rounded)}>
                    Cancel
                </button>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Title <span className="text-red-400">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="Task title" required />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={cn(inputClass, "resize-none")} placeholder="Add details..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5"><CheckCircle2 className="w-3 h-3 inline mr-1" />Status</label>
                    <select value={formData.statusId} onChange={(e) => setFormData({ ...formData, statusId: e.target.value })} className={cn(inputClass, "cursor-pointer")} style={currentStatus ? { borderLeftWidth: '3px', borderLeftColor: currentStatus.color } : {}}>
                        {allStatuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5"><Flag className="w-3 h-3 inline mr-1" />Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) as TaskPriority })} className={cn(inputClass, "cursor-pointer", currentPriority.bg, currentPriority.color)}>
                        {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5"><Calendar className="w-3 h-3 inline mr-1" />Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className={inputClass} />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5"><Users className="w-3 h-3 inline mr-1" />Assignees</label>
                {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedMembers.map((m) => (
                            <span key={m.user.id} className={cn("inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700", rounded)}>
                                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white", m.user.avatarUrl ? '' : getAvatarColor(m.user.name))}>
                                    {m.user.avatarUrl ? <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : m.user.name.charAt(0).toUpperCase()}
                                </span>
                                {m.user.name}
                                <button type="button" onClick={() => toggleAssignee(m.user.id)} className="ml-0.5 p-0.5 hover:bg-blue-100 rounded-full transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <button type="button" onClick={() => setShowAssigneePicker(!showAssigneePicker)} className={cn("w-full px-3 py-2 border border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left flex items-center gap-2", rounded)}>
                        <Users className="w-3.5 h-3.5" />
                        {selectedMembers.length === 0 ? 'Assign team members...' : 'Add more...'}
                    </button>
                    {showAssigneePicker && (
                        <div className={cn("absolute z-20 mt-1 w-full bg-white border border-gray-200 shadow-lg max-h-56 overflow-hidden", roundedMd)}>
                            <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                    <input type="text" placeholder="Search..." value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} className={cn("w-full pl-8 pr-3 py-1.5 text-xs border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 bg-gray-50", rounded)} />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-44">
                                {filteredMembers.map((m) => {
                                    const isSelected = formData.assigneeIds?.includes(m.user.id);
                                    return (
                                        <button key={m.user.id} type="button" onClick={() => toggleAssignee(m.user.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50", isSelected && "bg-blue-50/50")}>
                                            <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white", m.user.avatarUrl ? '' : getAvatarColor(m.user.name))}>
                                                {m.user.avatarUrl ? <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : m.user.name.charAt(0).toUpperCase()}
                                            </span>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="text-xs font-medium text-gray-800 truncate">{m.user.name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{m.user.email}</div>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <p className={cn("text-sm text-red-600 bg-red-50 p-3 border border-red-100 font-medium", rounded)}>{error}</p>}
        </form>
    );
}
