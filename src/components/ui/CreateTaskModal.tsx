import { TaskPriority, CreateTaskPayload, Task, WorkflowStage } from '@/types/task';
import type { ProjectMember } from '@/types/project';
import type { PhaseWithTaskLists, TaskList } from '@/types/phase';
import React, { useState, useEffect, useMemo } from 'react';
import { X, Flag, Calendar, Users, AlignLeft, CheckCircle2, Layers, ListTodo, Search, Check, AlertCircle } from 'lucide-react';
import { cn, getAvatarColor } from '@/lib/utils';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskPayload) => Promise<void>;
    workflow: WorkflowStage[];
    parentTask?: Task | any | null;
    initialData?: Task | any;
    isReadOnly?: boolean;
    taskListId?: string;
    phaseId?: string;
    members?: ProjectMember[];
    phases?: PhaseWithTaskLists[];
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; bg: string; icon: string }[] = [
    { value: 1, label: 'Lowest', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: '⬇' },
    { value: 2, label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '↓' },
    { value: 3, label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: '→' },
    { value: 4, label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: '↑' },
    { value: 5, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '⬆' },
];

export function CreateTaskModal({
    isOpen,
    onClose,
    onSubmit,
    workflow,
    parentTask,
    initialData,
    isReadOnly = false,
    taskListId,
    phaseId,
    members = [],
    phases = [],
}: CreateTaskModalProps) {
    const [formData, setFormData] = useState<CreateTaskPayload>({
        title: '',
        description: '',
        priority: 3,
        statusId: '',
        dueDate: '',
        assigneeIds: [],
        parentId: null,
        taskListId: taskListId || '',
        phaseId: phaseId || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const allStatuses = useMemo(() =>
        workflow.flatMap(stage =>
            stage.statuses.map(status => ({ ...status, stageName: stage.name }))
        ),
        [workflow]
    );

    const defaultStatusId = useMemo(() =>
        allStatuses.find(s => s.isDefault)?.id || allStatuses[0]?.id || '',
        [allStatuses]
    );

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    description: initialData.description || '',
                    priority: initialData.priority,
                    statusId: initialData.status?.id || defaultStatusId,
                    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
                    assigneeIds: initialData.assigneeIds || initialData.assignees?.map((a: any) => a.id || a.userId) || [],
                    parentId: initialData.parentId,
                    taskListId: taskListId || '',
                    phaseId: phaseId || '',
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    priority: 3,
                    statusId: defaultStatusId,
                    dueDate: '',
                    assigneeIds: [],
                    parentId: parentTask?.id || null,
                    taskListId: taskListId || '',
                    phaseId: phaseId || '',
                });
            }
            setError(null);
            setSubmitted(false);
            setShowAssigneePicker(false);
            setAssigneeSearch('');
        }
    }, [isOpen, initialData, parentTask, workflow, taskListId, phaseId, defaultStatusId]);

    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return members;
        const q = assigneeSearch.toLowerCase();
        return members.filter(m =>
            m.user.name.toLowerCase().includes(q) ||
            m.user.email.toLowerCase().includes(q)
        );
    }, [members, assigneeSearch]);

    const selectedMembers = useMemo(() =>
        members.filter(m => formData.assigneeIds?.includes(m.user.id)),
        [members, formData.assigneeIds]
    );

    const toggleAssignee = (userId: string) => {
        setFormData(prev => {
            const current = prev.assigneeIds || [];
            const next = current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId];
            return { ...prev, assigneeIds: next };
        });
    };

    const currentPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority) || PRIORITY_OPTIONS[2];

    const currentStatus = allStatuses.find(s => s.id === formData.statusId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setError(null);

        if (!formData.title.trim() || !formData.phaseId || !formData.taskListId) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch {
            setError('Failed to save task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPhase = phases.find(p => p.id === formData.phaseId);
    const availableTaskLists = selectedPhase?.taskLists || [];

    const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
    const [phaseSearch, setPhaseSearch] = useState('');
    const [showTaskListDropdown, setShowTaskListDropdown] = useState(false);
    const [taskListSearch, setTaskListSearch] = useState('');

    const filteredPhases = useMemo(() => {
        if (!phaseSearch.trim()) return phases;
        return phases.filter(p => p.name.toLowerCase().includes(phaseSearch.toLowerCase()));
    }, [phases, phaseSearch]);

    const filteredTaskLists = useMemo(() => {
        if (!taskListSearch.trim()) return availableTaskLists;
        return availableTaskLists.filter(tl => tl.name.toLowerCase().includes(taskListSearch.toLowerCase()));
    }, [availableTaskLists, taskListSearch]);

    const isFormValid = !!(formData.title.trim() && formData.phaseId && formData.taskListId);

    if (!isOpen) return null;

    const isEditing = !!initialData;
    const isSubtask = !!parentTask;
    const modalTitle = isReadOnly
        ? 'Task Details'
        : isEditing
            ? 'Edit Task'
            : isSubtask
                ? `Add Subtask`
                : 'Create Task';

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{modalTitle}</h2>
                        {isSubtask && parentTask && (
                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium truncate max-w-[200px]">
                                Parent: <span className="text-gray-600 truncate">{parentTask.title}</span>
                            </p>
                        )}
                        {taskListId && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <ListTodo className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] text-gray-400 font-medium">Adding to task list</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto">
                    <form className="p-5 space-y-5" onSubmit={handleSubmit}>
                        {/* Phase & Task List Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Phase Dropdown */}
                            <div className="relative">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <Layers className="w-3 h-3 text-indigo-500" /> Phase <span className="text-red-400">*</span>
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => setShowPhaseDropdown(!showPhaseDropdown)}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                            submitted && !formData.phaseId
                                                ? "border-red-500 ring-red-500/10 focus:ring-red-500/20 focus:border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                                : "border-gray-200 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]",
                                            isReadOnly && "bg-gray-50 text-gray-500 cursor-default"
                                        )}
                                    >
                                        <span className="truncate flex-1">
                                            {selectedPhase?.name || "Select Phase"}
                                        </span>
                                        <Layers className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showPhaseDropdown && "rotate-180")} />
                                    </button>

                                    {showPhaseDropdown && !isReadOnly && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowPhaseDropdown(false)} />
                                            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-xl max-h-60 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search phases..."
                                                            value={phaseSearch}
                                                            onChange={(e) => setPhaseSearch(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-48 custom-scrollbar">
                                                    {filteredPhases.length === 0 ? (
                                                        <div className="px-3 py-4 text-center text-xs text-gray-400 italic">No phases found</div>
                                                    ) : (
                                                        filteredPhases.map((phase) => (
                                                            <button
                                                                key={phase.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        phaseId: phase.id,
                                                                        taskListId: ''
                                                                    });
                                                                    setShowPhaseDropdown(false);
                                                                    setPhaseSearch('');
                                                                }}
                                                                title={phase.name}
                                                                className={cn(
                                                                    "w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50/80 transition-colors flex items-center justify-between gap-2 group",
                                                                    formData.phaseId === phase.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                                                                )}
                                                            >
                                                                <span className="truncate flex-1">{phase.name}</span>
                                                                {formData.phaseId === phase.id ? (
                                                                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
                                                                ) : (
                                                                    <Layers className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                )}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {submitted && !formData.phaseId && (
                                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-2.5 h-2.5" /> Please select a phase
                                    </p>
                                )}
                            </div>

                            {/* Task List Dropdown */}
                            <div className="relative group/tl-dropdown">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <ListTodo className="w-3 h-3 text-emerald-500" /> Task List <span className="text-red-400">*</span>
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        disabled={isReadOnly || !formData.phaseId}
                                        onClick={() => setShowTaskListDropdown(!showTaskListDropdown)}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                            submitted && !formData.taskListId && formData.phaseId
                                                ? "border-red-500 ring-red-500/10 focus:ring-red-500/20 focus:border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                                : "border-gray-200 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]",
                                            (!formData.phaseId || isReadOnly) && "bg-gray-50 text-gray-500 cursor-not-allowed opacity-60"
                                        )}
                                    >
                                        <span className="truncate flex-1">
                                            {availableTaskLists.find(tl => tl.id === formData.taskListId)?.name || "Select Task List"}
                                        </span>
                                        <ListTodo className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showTaskListDropdown && "rotate-180")} />
                                    </button>

                                    {showTaskListDropdown && formData.phaseId && !isReadOnly && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowTaskListDropdown(false)} />
                                            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-xl max-h-60 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search task lists..."
                                                            value={taskListSearch}
                                                            onChange={(e) => setTaskListSearch(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-48 custom-scrollbar">
                                                    {filteredTaskLists.length === 0 ? (
                                                        <div className="px-3 py-4 text-center text-xs text-gray-400 italic">No task lists found</div>
                                                    ) : (
                                                        filteredTaskLists.map((tl) => (
                                                            <button
                                                                key={tl.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, taskListId: tl.id });
                                                                    setShowTaskListDropdown(false);
                                                                    setTaskListSearch('');
                                                                }}
                                                                title={tl.name}
                                                                className={cn(
                                                                    "w-full px-3 py-2.5 text-left text-sm hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-2 group",
                                                                    formData.taskListId === tl.id ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-700"
                                                                )}
                                                            >
                                                                <span className="truncate flex-1">{tl.name}</span>
                                                                {formData.taskListId === tl.id ? (
                                                                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                                                                ) : (
                                                                    <ListTodo className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                )}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {!formData.phaseId && !isReadOnly && (
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/tl-dropdown:opacity-100 transition-opacity pointer-events-none">
                                            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {submitted && !formData.taskListId && formData.phaseId && (
                                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-2.5 h-2.5" /> Please select a task list
                                    </p>
                                )}
                                {!formData.phaseId && !isReadOnly && (
                                    <p className="text-[10px] text-red-500 mt-1 font-medium opacity-0 group-hover/tl-dropdown:opacity-100 transition-opacity">
                                        Select a phase first
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={cn(
                                    "w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300",
                                    submitted && !formData.title.trim()
                                        ? "border-red-500 ring-red-500/10 focus:ring-red-500/20 focus:border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                        : "border-gray-200 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]",
                                    isReadOnly && "bg-gray-50 text-gray-500"
                                )}
                                placeholder="What needs to be done?"
                                autoFocus={!isReadOnly}
                                disabled={isReadOnly}
                            />
                            {submitted && !formData.title.trim() && (
                                <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" /> Task title is required
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <AlignLeft className="w-3 h-3" /> Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-300 transition-all"
                                placeholder="Add more details..."
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Status & Priority Row */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> Status <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.statusId}
                                        onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                                        disabled={isReadOnly}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:bg-gray-50 disabled:text-gray-500 appearance-none bg-white transition-all cursor-pointer"
                                        style={currentStatus ? {
                                            borderLeftWidth: '3px',
                                            borderLeftColor: currentStatus.color,
                                        } : {}}
                                    >
                                        {allStatuses.map((status) => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <Flag className="w-3 h-3" /> Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) as TaskPriority })}
                                    disabled={isReadOnly}
                                    className={cn(
                                        "w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 appearance-none cursor-pointer transition-all",
                                        currentPriority.bg, currentPriority.color,
                                        isReadOnly && "!bg-gray-50 !text-gray-500"
                                    )}
                                >
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.icon} {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                disabled={isReadOnly}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                            />
                        </div>

                        {/* Assignees */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> Assignees
                            </label>

                            {/* Selected Assignees */}
                            {selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {selectedMembers.map((m) => (
                                        <span
                                            key={m.user.id}
                                            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700"
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
                                                m.user.avatarUrl ? '' : getAvatarColor(m.user.name)
                                            )}>
                                                {m.user.avatarUrl ? (
                                                    <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    m.user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            {m.user.name}
                                            {!isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAssignee(m.user.id)}
                                                    className="ml-0.5 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {!isReadOnly && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                                        className="w-full px-3 py-2.5 border border-gray-200 border-dashed rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left flex items-center gap-2"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        {selectedMembers.length === 0 ? 'Click to assign team members...' : 'Add more...'}
                                    </button>

                                    {showAssigneePicker && (
                                        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-56 overflow-hidden">
                                            <div className="p-2 border-b border-gray-100">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search members..."
                                                        value={assigneeSearch}
                                                        onChange={(e) => setAssigneeSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 bg-gray-50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto max-h-44">
                                                {filteredMembers.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-gray-400">No members found</div>
                                                ) : (
                                                    filteredMembers.map((m) => {
                                                        const isSelected = formData.assigneeIds?.includes(m.user.id);
                                                        return (
                                                            <button
                                                                key={m.user.id}
                                                                type="button"
                                                                onClick={() => toggleAssignee(m.user.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                                                                    isSelected && "bg-blue-50/50"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0",
                                                                    m.user.avatarUrl ? '' : getAvatarColor(m.user.name)
                                                                )}>
                                                                    {m.user.avatarUrl ? (
                                                                        <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                                    ) : (
                                                                        m.user.name.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-medium text-gray-800 truncate">{m.user.name}</div>
                                                                    <div className="text-[10px] text-gray-400 truncate">{m.user.email}</div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-medium">{error}</p>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isFormValid}
                            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[110px] cursor-pointer"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                isEditing ? 'Save Changes' : (isSubtask ? 'Add Subtask' : 'Create Task')
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
