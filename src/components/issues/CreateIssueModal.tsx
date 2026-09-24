import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Calendar,
    Users,
    AlignLeft,
    CheckCircle2 as CheckCircleIcon,
    Layers,
    ListTodo,
    Search,
    Check,
    AlertCircle,
    Bug,
    ShieldAlert,
    Cpu,
    Zap,
    LayoutGrid,
    HelpCircle,
    Flame,
    Flag,
    Plus,
    Tag,
    RefreshCw,
    Link2,
    Paperclip,
    Upload,
    FileImage,
    FileText,
    FileSpreadsheet,
    FileArchive,
    Info,
    Folder,
    ChevronDown,
} from 'lucide-react';
import { cn, getAvatarColor } from '@/lib/utils';
import type { IssueType, IssueSeverity, IssuePriority, CreateIssuePayload } from '@/types/issue';
import type { Task, WorkflowStage } from '@/types/task';
import type { ProjectMember, Project } from '@/types/project';
import type { PhaseWithTaskLists } from '@/types/phase';
import { useCreateStatus, useProjectWorkflow, useProjectTasks } from '@/hooks/use-tasks';
import { useProjects, useProjectMembers } from '@/hooks/use-projects';
import { useStructuredPhases } from '@/hooks/use-phases';
import { useToast } from '@/components/ui/Toast';

interface CreateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateIssuePayload, targetProjectId?: string) => Promise<void>;
    workflow?: WorkflowStage[];
    tasks?: Task[];
    members?: ProjectMember[];
    phases?: PhaseWithTaskLists[];
    projectName?: string;
    projectColor?: string | null;
    projectId?: string;
    /** Prefill phase / task list / task when creating from a task row */
    initialValues?: {
        phaseId?: string;
        taskListId?: string;
        taskId?: string;
    };
}

const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string; color: string; bg: string; icon: any }[] = [
    { value: 'BUG', label: 'Bug', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Bug },
    { value: 'UI', label: 'UI Issue', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: LayoutGrid },
    { value: 'LOGIC', label: 'Logic', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Cpu },
    { value: 'PERFORMANCE', label: 'Perf', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Zap },
    { value: 'SECURITY', label: 'Security', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: ShieldAlert },
    { value: 'OTHER', label: 'Other', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: HelpCircle },
];

const SEVERITY_OPTIONS: { value: IssueSeverity; label: string; color: string; bg: string; icon: any }[] = [
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: Flame },
    { value: 'HIGH', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: ShieldAlert },
    { value: 'MEDIUM', label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
    { value: 'LOW', label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CheckCircleIcon },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; color: string; bg: string; icon: string }[] = [
    { value: 1, label: 'Lowest', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: '⬇' },
    { value: 2, label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '↓' },
    { value: 3, label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: '→' },
    { value: 4, label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: '↑' },
    { value: 5, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '⬆' },
];

export function CreateIssueModal({
    isOpen,
    onClose,
    onSubmit,
    workflow,
    tasks = [],
    members = [],
    phases = [],
    projectName,
    projectColor,
    projectId,
    initialValues,
}: CreateIssueModalProps) {
    const toast = useToast();
    const { data: projectsData } = useProjects({ limit: 100 });
    const projects: Project[] = useMemo(() => projectsData?.data ?? [], [projectsData]);

    const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
    const prevIsOpenRef = React.useRef(false);

    useEffect(() => {
        // Only set initial project when modal transitions from closed to open
        if (isOpen && !prevIsOpenRef.current) {
            setSelectedProjectId(projectId || '');
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, projectId]);

    const activeProject = useMemo(() => {
        const idToFind = selectedProjectId || projectId;
        if (!idToFind) return null;
        return projects.find((p: any) => p.id === idToFind) || null;
    }, [projects, selectedProjectId, projectId]);

    const currentProjectId = selectedProjectId || activeProject?.id || projectId || '';
    const currentProjectName = activeProject?.name || (currentProjectId ? projectName : '');
    const currentProjectColor = activeProject?.color || (currentProjectId ? projectColor : null);

    // Dynamically fetch project metadata if project changes or if props are omitted
    const { data: fetchedWorkflow = [] } = useProjectWorkflow(currentProjectId);
    const { data: fetchedPhases = [] } = useStructuredPhases(currentProjectId);
    const { data: fetchedMembers = [] } = useProjectMembers(currentProjectId);
    const { data: fetchedTasks = [] } = useProjectTasks(currentProjectId);

    const activeWorkflow = (workflow && workflow.length > 0 && currentProjectId === projectId) ? workflow : fetchedWorkflow;
    const activePhases = (phases && phases.length > 0 && currentProjectId === projectId) ? phases : fetchedPhases;
    const activeMembers = (members && members.length > 0 && currentProjectId === projectId) ? members : fetchedMembers;
    const activeTasks = (tasks && tasks.length > 0 && currentProjectId === projectId) ? tasks : fetchedTasks;

    const createStatusMutation = useCreateStatus(currentProjectId);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown toggles & searches
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
    const [phaseSearch, setPhaseSearch] = useState('');
    const [showTaskListDropdown, setShowTaskListDropdown] = useState(false);
    const [taskListSearch, setTaskListSearch] = useState('');
    const [showTaskDropdown, setShowTaskDropdown] = useState(false);
    const [taskSearch, setTaskSearch] = useState('');

    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [statusSearch, setStatusSearch] = useState('');
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState('');
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const filteredProjects = useMemo(() => {
        if (!projectSearch.trim()) return projects;
        const q = projectSearch.toLowerCase();
        return projects.filter((p: any) => {
            const name = (p.name || p.projectName || '').toLowerCase();
            const pid = (p.projectId || '').toLowerCase();
            return name.includes(q) || pid.includes(q);
        });
    }, [projects, projectSearch]);

    const allStatuses = useMemo(() =>
        activeWorkflow.flatMap(stage =>
            stage.statuses.map(status => ({ ...status, stageName: stage.name }))
        ),
        [activeWorkflow]
    );

    const defaultStatusId = useMemo(() =>
        allStatuses.find(s => s.isDefault)?.id || allStatuses[0]?.id || '',
        [allStatuses]
    );

    const [formData, setFormData] = useState<CreateIssuePayload>({
        title: '',
        description: '',
        expectedOutput: '',
        actualOutput: '',
        type: 'BUG',
        severity: 'MEDIUM',
        priority: 3,
        statusId: defaultStatusId,
        phaseId: '',
        taskListId: '',
        taskId: '',
        dueDate: '',
        startDate: '',
        assigneeIds: [],
        tagIds: [],
    });

    const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }>>([]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                expectedOutput: '',
                actualOutput: '',
                type: 'BUG',
                severity: 'MEDIUM',
                priority: 3,
                statusId: defaultStatusId,
                phaseId: initialValues?.phaseId || '',
                taskListId: initialValues?.taskListId || '',
                taskId: initialValues?.taskId || '',
                dueDate: '',
                startDate: '',
                assigneeIds: [],
                tagIds: [],
            });
            setError(null);
            setSubmitted(false);
            setShowPhaseDropdown(false);
            setShowTaskListDropdown(false);
            setShowTaskDropdown(false);
            setShowStatusDropdown(false);
            setShowAssigneePicker(false);
            setIsCreatingStatus(false);
            setNewStatusName('');
            setTaskSearch('');
            setPhaseSearch('');
            setTaskListSearch('');
            setAttachments([]);
        }
    }, [isOpen, defaultStatusId, initialValues?.phaseId, initialValues?.taskListId, initialValues?.taskId]);

    const selectedPhase = activePhases.find(p => p.id === formData.phaseId);
    const availableTaskLists = selectedPhase?.taskLists || [];

    const selectedTask = useMemo(() =>
        activeTasks.find(t => t.id === formData.taskId),
        [activeTasks, formData.taskId]
    );

    const filteredPhases = useMemo(() => {
        if (!phaseSearch.trim()) return activePhases;
        return activePhases.filter(p => p.name.toLowerCase().includes(phaseSearch.toLowerCase()));
    }, [activePhases, phaseSearch]);

    const filteredTaskLists = useMemo(() => {
        if (!taskListSearch.trim()) return availableTaskLists;
        return availableTaskLists.filter(tl => tl.name.toLowerCase().includes(taskListSearch.toLowerCase()));
    }, [availableTaskLists, taskListSearch]);

    const filteredTasks = useMemo(() => {
        return activeTasks.filter(t => {
            if (formData.phaseId && t.phaseId && t.phaseId !== formData.phaseId) return false;
            if (formData.taskListId && t.taskListId && t.taskListId !== formData.taskListId) return false;
            if (taskSearch.trim() && !t.title.toLowerCase().includes(taskSearch.toLowerCase())) return false;
            return true;
        });
    }, [activeTasks, formData.phaseId, formData.taskListId, taskSearch]);

    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return activeMembers;
        const q = assigneeSearch.toLowerCase();
        return activeMembers.filter(m => {
            const user = m?.user || m;
            const name = user?.name || '';
            const email = user?.email || '';
            return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
        });
    }, [activeMembers, assigneeSearch]);

    const selectedMembers = useMemo(() =>
        activeMembers.filter(m => {
            const uid = m?.user?.id || m?.userId || m?.id;
            return uid && formData.assigneeIds?.includes(uid);
        }),
        [activeMembers, formData.assigneeIds]
    );

    const currentStatus = allStatuses.find(s => s.id === formData.statusId);
    const currentPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority) || PRIORITY_OPTIONS[2];

    const handleTaskSelect = (taskId: string) => {
        if (!taskId) {
            setFormData(prev => ({ ...prev, taskId: '' }));
            return;
        }

        const t = activeTasks.find(item => item.id === taskId);
        if (!t) {
            setFormData(prev => ({ ...prev, taskId }));
            return;
        }

        let taskAssigneeIds: string[] = [];
        if (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0) {
            taskAssigneeIds = t.assigneeIds;
        } else if (Array.isArray((t as any).assignees) && (t as any).assignees.length > 0) {
            taskAssigneeIds = (t as any).assignees
                .map((a: any) => a.userId || a.id)
                .filter(Boolean);
        }

        setFormData(prev => ({
            ...prev,
            taskId: t.id,
            phaseId: t.phaseId || prev.phaseId,
            taskListId: t.taskListId || prev.taskListId,
            expectedOutput: t.expectedOutput !== undefined && t.expectedOutput !== null && t.expectedOutput !== ''
                ? t.expectedOutput
                : prev.expectedOutput,
            assigneeIds: taskAssigneeIds.length > 0 ? taskAssigneeIds : prev.assigneeIds,
        }));
    };

    const toggleAssignee = (userId: string) => {
        setFormData(prev => {
            const current = prev.assigneeIds || [];
            const next = current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId];
            return { ...prev, assigneeIds: next };
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileUrl = event.target?.result as string;
                setAttachments((prev) => [
                    ...prev,
                    {
                        fileName: file.name,
                        fileUrl: fileUrl,
                        mimeType: file.type,
                        fileSize: file.size,
                    },
                ]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleCreateCustomStatus = async () => {
        if (!newStatusName.trim() || !activeWorkflow.length) return;
        const firstStage = activeWorkflow[0];
        try {
            const newStatus = await createStatusMutation.mutateAsync({
                stageId: firstStage.id,
                name: newStatusName.trim(),
                color: '#ef4444',
            });
            setFormData(prev => ({ ...prev, statusId: newStatus.id }));
            setIsCreatingStatus(false);
            setNewStatusName('');
            setShowStatusDropdown(false);
            toast.success('New status created');
        } catch (err: any) {
            toast.error('Failed to create status', err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setError(null);

        if (!currentProjectId) {
            setError('Project is required. Please select a project.');
            return;
        }

        if (!formData.title.trim()) {
            setError('Issue title is required.');
            return;
        }

        if (!formData.phaseId) {
            setError('Phase is mandatory. Please select a phase.');
            return;
        }

        if (!formData.taskListId) {
            setError('Task list is mandatory. Please select a task list.');
            return;
        }

        if (!formData.taskId) {
            setError('Linked task is mandatory. Please select a task.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateIssuePayload = {
                ...formData,
                dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? formData.dueDate : undefined,
                startDate: formData.startDate && formData.startDate.trim() !== '' ? formData.startDate : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
            };
            await onSubmit(payload, currentProjectId);
            toast.success('Issue reported successfully');
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to create issue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                    <div className="flex items-center gap-2">
                        <Bug className="w-5 h-5 text-red-600" />
                        <h2 className="text-base font-bold text-gray-900">Report Issue</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentProjectName && (
                            <span
                                className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-tight shadow-xs transition-all"
                                style={{
                                    backgroundColor: currentProjectColor ? `${currentProjectColor}15` : '#f3f4f6',
                                    color: currentProjectColor || '#6b7280',
                                    borderColor: currentProjectColor ? `${currentProjectColor}30` : '#e5e7eb'
                                }}
                            >
                                {currentProjectName}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto">
                    <form className="p-5 space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Top Mandatory Section: Linked Task, Phase, Task List */}
                        <div className="p-3.5 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-blue-50/40 border border-indigo-100/80 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <Link2 className="w-4 h-4 text-indigo-600" /> Location & Linked Task
                                </span>
                            </div>

                            {/* Project Selection */}
                            <div className="relative">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Folder className="w-3.5 h-3.5 text-indigo-500" /> Project <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left flex items-center justify-between gap-2 uppercase cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 truncate flex-1">
                                            {currentProjectColor && (
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: currentProjectColor }}
                                                />
                                            )}
                                            <span className={cn("truncate font-bold", currentProjectName ? "text-gray-900" : "text-gray-400 font-medium")}>
                                                {currentProjectName || "Select Project..."}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showProjectDropdown && "rotate-180")} />
                                    </button>

                                    {showProjectDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowProjectDropdown(false)} />
                                            <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-60 overflow-hidden flex flex-col">
                                                {projects.length > 5 && (
                                                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Search projects..."
                                                                value={projectSearch}
                                                                onChange={(e) => setProjectSearch(e.target.value)}
                                                                className="w-full pl-8 pr-3 py-1 border border-gray-200 rounded text-xs text-gray-900 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="overflow-y-auto max-h-48 p-1">
                                                    {filteredProjects.length === 0 ? (
                                                        <div className="p-2 text-center text-xs text-gray-400">No projects found</div>
                                                    ) : (
                                                        filteredProjects.map((p: any) => {
                                                            const pName = p.name || p.projectName || 'Project';
                                                            const pColor = p.color || p.projectColor || '#3b82f6';
                                                            const pCode = p.projectId ? `(${p.projectId})` : '';

                                                            return (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedProjectId(p.id);
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            phaseId: '',
                                                                            taskListId: '',
                                                                            taskId: '',
                                                                            assigneeIds: [],
                                                                        }));
                                                                        setShowProjectDropdown(false);
                                                                        setProjectSearch('');
                                                                    }}
                                                                    className={cn(
                                                                        "w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between uppercase font-semibold cursor-pointer",
                                                                        currentProjectId === p.id
                                                                            ? "bg-indigo-50 text-indigo-700 font-bold"
                                                                            : "hover:bg-gray-50 text-gray-800"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 truncate flex-1">
                                                                        <div
                                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                            style={{ backgroundColor: pColor }}
                                                                        />
                                                                        <span className="truncate font-semibold text-gray-900">{pName}</span>
                                                                        {pCode && <span className="text-[10px] text-gray-400 font-normal shrink-0">{pCode}</span>}
                                                                    </div>
                                                                    {currentProjectId === p.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Phase & Task List Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Phase Dropdown */}
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-indigo-500" /> Phase <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowPhaseDropdown(!showPhaseDropdown)}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                                submitted && !formData.phaseId
                                                    ? "border-red-500 ring-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                                    : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            )}
                                        >
                                            <span className="truncate flex-1 uppercase">
                                                {selectedPhase?.name || "Select Phase"}
                                            </span>
                                            <Layers className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showPhaseDropdown && "rotate-180")} />
                                        </button>

                                        {showPhaseDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowPhaseDropdown(false)} />
                                                <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-60 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Search phases..."
                                                                value={phaseSearch}
                                                                onChange={(e) => setPhaseSearch(e.target.value)}
                                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
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
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            phaseId: phase.id,
                                                                            taskListId: '',
                                                                            taskId: '',
                                                                        }));
                                                                        setShowPhaseDropdown(false);
                                                                        setPhaseSearch('');
                                                                    }}
                                                                    className={cn(
                                                                        "w-full px-3 py-2 text-left text-xs hover:bg-indigo-50/80 transition-colors flex items-center justify-between gap-2 group",
                                                                        formData.phaseId === phase.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                                                                    )}
                                                                >
                                                                    <span className="truncate flex-1">{phase.name}</span>
                                                                    {formData.phaseId === phase.id && (
                                                                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
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
                                        <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-2.5 h-2.5" /> Phase is required
                                        </p>
                                    )}
                                </div>

                                {/* Task List Dropdown */}
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <ListTodo className="w-3 h-3 text-emerald-500" /> Task List <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            disabled={!formData.phaseId}
                                            onClick={() => setShowTaskListDropdown(!showTaskListDropdown)}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                                !formData.phaseId && "bg-gray-50 text-gray-400 cursor-not-allowed",
                                                submitted && !formData.taskListId
                                                    ? "border-red-500 ring-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                                    : "border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            )}
                                        >
                                            <span className="truncate flex-1 uppercase">
                                                {availableTaskLists.find(tl => tl.id === formData.taskListId)?.name || "Select Task List"}
                                            </span>
                                            <ListTodo className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showTaskListDropdown && "rotate-180")} />
                                        </button>

                                        {showTaskListDropdown && formData.phaseId && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowTaskListDropdown(false)} />
                                                <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-60 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Search task lists..."
                                                                value={taskListSearch}
                                                                onChange={(e) => setTaskListSearch(e.target.value)}
                                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
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
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            taskListId: tl.id,
                                                                            taskId: '',
                                                                        }));
                                                                        setShowTaskListDropdown(false);
                                                                        setTaskListSearch('');
                                                                    }}
                                                                    className={cn(
                                                                        "w-full px-3 py-2 text-left text-xs hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-2 group",
                                                                        formData.taskListId === tl.id ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-700"
                                                                    )}
                                                                >
                                                                    <span className="truncate flex-1">{tl.name}</span>
                                                                    {formData.taskListId === tl.id && (
                                                                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                                                                    )}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {submitted && !formData.taskListId && (
                                        <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-2.5 h-2.5" /> Task list is required
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Linked Task Dropdown */}
                            <div className="relative">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Link2 className="w-3 h-3 text-blue-500" /> Linked Task <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-md text-xs font-semibold focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                            submitted && !formData.taskId
                                                ? "border-red-500 ring-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.1)] text-gray-700"
                                                : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                                        )}
                                    >
                                        <span className="truncate flex-1">
                                            {selectedTask?.title || "Select Linked Task..."}
                                        </span>
                                        <Link2 className={cn("w-3.5 h-3.5 text-blue-500 transition-transform", showTaskDropdown && "rotate-180")} />
                                    </button>

                                    {showTaskDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowTaskDropdown(false)} />
                                            <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-64 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search tasks..."
                                                            value={taskSearch}
                                                            onChange={(e) => setTaskSearch(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-48 custom-scrollbar">
                                                    {filteredTasks.length === 0 ? (
                                                        <div className="px-3 py-4 text-center text-xs text-gray-400 italic">No tasks found</div>
                                                    ) : (
                                                        filteredTasks.map((t) => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleTaskSelect(t.id);
                                                                    setShowTaskDropdown(false);
                                                                    setTaskSearch('');
                                                                }}
                                                                className={cn(
                                                                    "w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50/80 transition-colors flex items-center justify-between gap-2 group border-b border-gray-50 last:border-0",
                                                                    formData.taskId === t.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                                                                )}
                                                            >
                                                                <div className="flex flex-col gap-0.5 truncate flex-1">
                                                                    <span className="truncate font-medium">{t.title}</span>
                                                                    {t.expectedOutput && (
                                                                        <span className="text-[10px] text-gray-400 truncate italic">
                                                                            Expected: {t.expectedOutput}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {formData.taskId === t.id && (
                                                                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                                                                )}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {submitted && !formData.taskId && (
                                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                                        <AlertCircle className="w-2.5 h-2.5" /> Linked task is required
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
                                    "w-full px-3 py-2.5 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300",
                                    submitted && !formData.title.trim()
                                        ? "border-red-500 ring-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                        : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                                )}
                                placeholder="What needs to be done?"
                            />
                            {submitted && !formData.title.trim() && (
                                <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" /> Issue title is required
                                </p>
                            )}
                        </div>

                        {/* Issue Type Grid */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-purple-500" /> Issue Type <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {ISSUE_TYPE_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = formData.type === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: opt.value })}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-semibold transition-all duration-200 active:scale-95",
                                                isSelected
                                                    ? `${opt.bg} ${opt.color} border-purple-500 shadow-xs scale-[1.02]`
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            )}
                                        >
                                            <Icon className={cn("w-3.5 h-3.5", isSelected ? opt.color : "text-gray-400")} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Assignees */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-gray-400" /> Assignees
                            </label>

                            {selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {selectedMembers.map((m) => {
                                        const user = m?.user || m;
                                        const uid = user?.id || m?.userId || m?.id;
                                        const name = user?.name || user?.email || 'User';
                                        return (
                                            <span
                                                key={uid}
                                                className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                                            >
                                                <div
                                                    className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase overflow-hidden shrink-0", getAvatarColor(name))}
                                                >
                                                    {user?.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                {name}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAssignee(uid)}
                                                    className="ml-0.5 p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                                    className="w-full px-3 py-2.5 border border-gray-200 border-dashed rounded-md text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left flex items-center gap-2"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    {selectedMembers.length === 0 ? 'Click to assign team members...' : 'Add more...'}
                                </button>

                                {showAssigneePicker && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowAssigneePicker(false)} />
                                        <div className="absolute z-30 bottom-full mb-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-52 overflow-hidden flex flex-col">
                                            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search members..."
                                                        value={assigneeSearch}
                                                        onChange={(e) => setAssigneeSearch(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                                {filteredMembers.map((m) => {
                                                    const user = m?.user || m;
                                                    const uid = user?.id || m?.userId || m?.id;
                                                    const name = user?.name || user?.email || 'User';
                                                    const isAssigned = formData.assigneeIds?.includes(uid);
                                                    return (
                                                        <button
                                                            key={uid}
                                                            type="button"
                                                            onClick={() => toggleAssignee(uid)}
                                                            className={cn(
                                                                "w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2",
                                                                isAssigned ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <div
                                                                    className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase overflow-hidden shrink-0", getAvatarColor(name))}
                                                                >
                                                                    {user?.avatarUrl ? (
                                                                        <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        name.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <span className="truncate">{name}</span>
                                                            </div>
                                                            {isAssigned && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <AlignLeft className="w-3 h-3 text-gray-400" /> Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none placeholder:text-gray-300 transition-all"
                                placeholder="Add more details..."
                            />
                        </div>

                        {/* Expected vs Actual Output */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <CheckCircleIcon className="w-3 h-3 text-emerald-500" /> Expected Output
                                </label>
                                <textarea
                                    value={formData.expectedOutput}
                                    onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-emerald-200 rounded-md text-xs bg-emerald-50/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-gray-300 transition-all"
                                    placeholder="What should happen?"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 text-red-500" /> Actual Output
                                </label>
                                <textarea
                                    value={formData.actualOutput}
                                    onChange={(e) => setFormData({ ...formData, actualOutput: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-red-200 rounded-md text-xs bg-red-50/20 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none placeholder:text-gray-300 transition-all"
                                    placeholder="What actually happened?"
                                />
                            </div>
                        </div>

                        {/* File Attachments */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" /> Issue Attachments / Screenshots
                                </label>
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    Max 25MB per file
                                </span>
                            </div>

                            {/* Supported Formats Banner */}
                            {/* <div className="mb-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 text-indigo-500" /> Supported File Formats
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">All standard formats supported</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                                        <FileImage className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">Images</div>
                                            <div className="text-[9px] text-slate-500 font-mono">PNG, JPG, WEBP, GIF</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                                        <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">Documents</div>
                                            <div className="text-[9px] text-slate-500 font-mono">PDF, DOC, DOCX</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">Spreadsheets</div>
                                            <div className="text-[9px] text-slate-500 font-mono">XLS, XLSX, CSV</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                                        <FileArchive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">Logs & Archives</div>
                                            <div className="text-[9px] text-slate-500 font-mono">TXT, LOG, ZIP</div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            <div className="relative border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/30 rounded-lg p-3.5 transition text-center cursor-pointer group">
                                <input
                                    type="file"
                                    multiple
                                    accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.zip"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Upload className="w-5 h-5 mx-auto text-gray-400 group-hover:text-indigo-500 transition mb-1" />
                                <p className="text-xs font-semibold text-gray-700">Click or drag files here to attach</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Max file size 25MB</p>
                            </div>

                            {attachments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                <span className="truncate font-medium text-gray-800">{att.fileName}</span>
                                                {att.fileSize && (
                                                    <span className="text-[10px] text-gray-400 shrink-0">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-gray-400 hover:text-red-600 transition p-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status, Priority, & Due Date Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Status Popover */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <CheckCircleIcon className="w-3 h-3 text-blue-500" /> Status <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 bg-white transition-all text-left flex items-center justify-between gap-2",
                                            submitted && !formData.statusId
                                                ? "border-red-500 ring-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]"
                                                : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        )}
                                        style={currentStatus ? {
                                            borderLeftWidth: '3px',
                                            borderLeftColor: currentStatus.color,
                                        } : {}}
                                    >
                                        <span className="truncate flex-1">
                                            {currentStatus?.name || "Select Status"}
                                        </span>
                                        <CheckCircleIcon className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showStatusDropdown && "rotate-180")} />
                                    </button>

                                    {showStatusDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowStatusDropdown(false)} />
                                            <div className="absolute z-30 bottom-full mb-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-64 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search statuses..."
                                                            value={statusSearch}
                                                            onChange={(e) => setStatusSearch(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto custom-scrollbar flex-1">
                                                    <div className="py-1">
                                                        {(statusSearch ? allStatuses.filter(s => s.name.toLowerCase().includes(statusSearch.toLowerCase())) : allStatuses).map((status) => (
                                                            <button
                                                                key={status.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, statusId: status.id });
                                                                    setShowStatusDropdown(false);
                                                                    setStatusSearch('');
                                                                }}
                                                                className={cn(
                                                                    "w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2",
                                                                    formData.statusId === status.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                                                                    <span className="truncate">{status.name}</span>
                                                                </div>
                                                                {formData.statusId === status.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Add Custom Status Button */}
                                                <div className="border-t border-gray-100 p-1.5 bg-gray-50/50">
                                                    {isCreatingStatus ? (
                                                        <div className="flex items-center gap-1.5 animate-in slide-in-from-bottom-2">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="New status name..."
                                                                value={newStatusName}
                                                                onChange={(e) => setNewStatusName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateCustomStatus();
                                                                    if (e.key === 'Escape') setIsCreatingStatus(false);
                                                                }}
                                                                className="flex-1 px-2 py-1.5 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleCreateCustomStatus}
                                                                disabled={!newStatusName.trim() || createStatusMutation.isPending}
                                                                className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                                            >
                                                                {createStatusMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsCreatingStatus(false)}
                                                                className="p-1.5 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingStatus(true)}
                                                            className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 border border-indigo-200 border-dashed rounded bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Add Custom Status
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Priority Select */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <Flag className="w-3 h-3 text-amber-500" /> Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) as IssuePriority })}
                                    className={cn(
                                        "w-full px-3 py-2.5 border rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer transition-all",
                                        currentPriority.bg, currentPriority.color
                                    )}
                                >
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.icon} {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-gray-400" /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate || ''}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Buttons Footer */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Issue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
