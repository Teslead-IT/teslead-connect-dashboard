import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Calendar,
    Users,
    AlignLeft,
    CheckCircle2,
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
    Trash2,
    Paperclip,
    History,
    Link2,
    ChevronDown,
    Upload,
    Plus,
    Tag,
} from 'lucide-react';
import { cn, getAvatarColor, formatDate } from '@/lib/utils';
import type { Issue, IssueType, IssueSeverity, IssuePriority, UpdateIssuePayload } from '@/types/issue';
import type { Task, WorkflowStage } from '@/types/task';
import type { ProjectMember } from '@/types/project';
import type { PhaseWithTaskLists } from '@/types/phase';
import { useIssueDetail, useUpdateIssue, useDeleteIssue, useAddIssueAttachment, useRemoveIssueAttachment } from '@/hooks/use-issues';
import { useToast } from '@/components/ui/Toast';

interface IssueViewModalProps {
    issueId: string | null;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    workflow: WorkflowStage[];
    members?: ProjectMember[];
    tasks?: Task[];
    phases?: PhaseWithTaskLists[];
    isReadOnly?: boolean;
}

const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string; icon: any; color: string; bg: string }[] = [
    { value: 'BUG', label: 'Bug', icon: Bug, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { value: 'UI', label: 'UI Issue', icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { value: 'LOGIC', label: 'Logic', icon: Cpu, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { value: 'PERFORMANCE', label: 'Perf', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { value: 'SECURITY', label: 'Security', icon: ShieldAlert, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { value: 'OTHER', label: 'Other', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
];

const SEVERITY_OPTIONS: { value: IssueSeverity; label: string; icon: any; color: string; bg: string }[] = [
    { value: 'CRITICAL', label: 'Critical', icon: Flame, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    { value: 'HIGH', label: 'High', icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { value: 'MEDIUM', label: 'Medium', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { value: 'LOW', label: 'Low', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; color: string; bg: string; icon: string }[] = [
    { value: 1, label: 'Lowest', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: '⬇' },
    { value: 2, label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: '↓' },
    { value: 3, label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: '→' },
    { value: 4, label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: '↑' },
    { value: 5, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '⬆' },
];

export function IssueViewModal({
    issueId,
    projectId,
    isOpen,
    onClose,
    workflow,
    members = [],
    tasks = [],
    phases = [],
    isReadOnly = false,
}: IssueViewModalProps) {
    const toast = useToast();
    const { data: issue, isLoading } = useIssueDetail(issueId || '');
    const updateMutation = useUpdateIssue(projectId);
    const deleteMutation = useDeleteIssue(projectId);
    const addAttachmentMutation = useAddIssueAttachment(projectId);
    const removeAttachmentMutation = useRemoveIssueAttachment(projectId);

    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'attachments'>('details');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form Draft State
    const [formData, setFormData] = useState<UpdateIssuePayload>({
        title: '',
        description: '',
        expectedOutput: '',
        actualOutput: '',
        type: 'BUG',
        priority: 3,
        statusId: '',
        phaseId: undefined,
        taskListId: undefined,
        taskId: undefined,
        dueDate: undefined,
        assigneeIds: [],
    });

    // Popover Toggle & Search States
    const [showStatusPop, setShowStatusPop] = useState(false);
    const [statusSearch, setStatusSearch] = useState('');
    const [showTypePop, setShowTypePop] = useState(false);
    const [showPrioPop, setShowPrioPop] = useState(false);
    const [showAssigneePop, setShowAssigneePop] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    const [showPhasePop, setShowPhasePop] = useState(false);
    const [phaseSearch, setPhaseSearch] = useState('');
    const [showTaskListPop, setShowTaskListPop] = useState(false);
    const [taskListSearch, setTaskListSearch] = useState('');
    const [showTaskPop, setShowTaskPop] = useState(false);
    const [taskSearch, setTaskSearch] = useState('');

    useEffect(() => {
        if (issue) {
            setFormData({
                title: issue.title || '',
                description: issue.description || '',
                expectedOutput: issue.expectedOutput || '',
                actualOutput: issue.actualOutput || '',
                type: issue.type || 'BUG',
                severity: issue.severity || undefined,
                priority: (issue.priority as IssuePriority) || 3,
                statusId: issue.status?.id || '',
                phaseId: issue.phaseId || undefined,
                taskListId: issue.taskListId || undefined,
                taskId: issue.taskId || undefined,
                dueDate: issue.dueDate ? issue.dueDate.split('T')[0] : undefined,
                assigneeIds: issue.assignees
                    ? issue.assignees.map((a: any) => a.id || a.userId || a.user?.id).filter(Boolean)
                    : [],
            });
        }
    }, [issue, isOpen]);

    const allStatuses = useMemo(() =>
        workflow.flatMap(stage =>
            stage.statuses.map(status => ({ ...status, stageName: stage.name }))
        ),
        [workflow]
    );

    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return members;
        const q = assigneeSearch.toLowerCase();
        return members.filter(m => {
            const u = m?.user || m;
            const n = u?.name || '';
            const e = u?.email || '';
            return n.toLowerCase().includes(q) || e.toLowerCase().includes(q);
        });
    }, [members, assigneeSearch]);

    const filteredPhases = useMemo(() => {
        if (!phaseSearch.trim()) return phases;
        return phases.filter(p => p.name.toLowerCase().includes(phaseSearch.toLowerCase()));
    }, [phases, phaseSearch]);

    const selectedPhase = useMemo(() =>
        phases.find(p => p.id === formData.phaseId),
        [phases, formData.phaseId]
    );

    const availableTaskLists = useMemo(() =>
        selectedPhase?.taskLists || [],
        [selectedPhase]
    );

    const selectedTaskList = useMemo(() =>
        availableTaskLists.find(tl => tl.id === formData.taskListId),
        [availableTaskLists, formData.taskListId]
    );

    const filteredTaskLists = useMemo(() => {
        if (!taskListSearch.trim()) return availableTaskLists;
        return availableTaskLists.filter(tl => tl.name.toLowerCase().includes(taskListSearch.toLowerCase()));
    }, [availableTaskLists, taskListSearch]);

    const filteredTasks = useMemo(() => {
        if (!taskSearch.trim()) return tasks;
        return tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()));
    }, [tasks, taskSearch]);

    const selectedTask = useMemo(() =>
        tasks.find(t => t.id === formData.taskId) || issue?.linkedTask,
        [tasks, formData.taskId, issue?.linkedTask]
    );

    const selectedAssignees = useMemo(() => {
        return (formData.assigneeIds || []).map(id => {
            const member = members.find(m => (m?.user?.id || m?.userId || m?.id) === id);
            if (member) {
                const u = member.user || member;
                return {
                    id,
                    name: u?.name || u?.email || 'User',
                    avatarUrl: u?.avatarUrl,
                };
            }
            const existing = issue?.assignees?.find((a: any) => (a.id || a.userId || a.user?.id) === id);
            if (existing) {
                return {
                    id,
                    name: existing.name || existing.email || 'User',
                    avatarUrl: existing.avatarUrl,
                };
            }
            return { id, name: 'User', avatarUrl: undefined };
        });
    }, [members, formData.assigneeIds, issue?.assignees]);

    if (!isOpen || !issueId) return null;

    const toggleAssignee = (userId: string) => {
        setFormData(prev => {
            const current = prev.assigneeIds || [];
            const next = current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId];
            return { ...prev, assigneeIds: next };
        });
    };

    const handleSave = async () => {
        if (!formData.title?.trim()) {
            toast.error('Title is required');
            return;
        }

        try {
            const payload: UpdateIssuePayload = {
                title: formData.title,
                description: formData.description,
                expectedOutput: formData.expectedOutput,
                actualOutput: formData.actualOutput,
                type: formData.type,
                severity: formData.severity,
                priority: formData.priority,
                statusId: formData.statusId,
                phaseId: formData.phaseId || null,
                taskListId: formData.taskListId || null,
                taskId: formData.taskId || null,
                dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? new Date(formData.dueDate).toISOString() : undefined,
                assigneeIds: formData.assigneeIds,
            };

            await updateMutation.mutateAsync({ issueId, data: payload });
            toast.success('Issue updated successfully');
        } catch (err: any) {
            toast.error('Failed to update issue');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(issueId);
            toast.success('Issue deleted');
            onClose();
        } catch (err: any) {
            toast.error('Failed to delete issue');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !issueId) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                await new Promise<void>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const fileUrl = event.target?.result as string;
                        try {
                            await addAttachmentMutation.mutateAsync({
                                issueId,
                                data: {
                                    fileName: file.name,
                                    fileUrl: fileUrl,
                                    mimeType: file.type,
                                    fileSize: file.size,
                                },
                            });
                        } catch (err) {
                            toast.error('Failed to attach file');
                        }
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            }
            toast.success('Files uploaded successfully');
        } catch (err) {
            toast.error('Error uploading files');
        } finally {
            setIsUploading(false);
        }
    };

    const currentStatus = allStatuses.find(s => s.id === formData.statusId) || issue?.status;
    const currentTypeOpt = ISSUE_TYPE_OPTIONS.find(o => o.value === formData.type) || ISSUE_TYPE_OPTIONS[0];
    const currentPrioOpt = PRIORITY_OPTIONS.find(o => o.value === formData.priority) || PRIORITY_OPTIONS[2];
    const TypeIcon = currentTypeOpt.icon;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 border-l border-gray-100">
                {/* Header Bar */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/80">
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                            <Bug className="w-3.5 h-3.5 text-red-600" />
                            {issue?.issueId || 'ISSUE'}
                        </span>
                        {issue?.projectName && (
                            <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200/60 uppercase tracking-tight">
                                {issue.projectName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Issue"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isLoading || !issue ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        <p className="text-xs text-gray-400 font-medium">Loading issue details...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Title Section */}
                        <div className="px-6 pt-5 pb-3">
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-red-500 outline-none pb-1 bg-transparent transition"
                                placeholder="Issue title..."
                            />
                        </div>

                        {/* Interactive Attribute Ribbon */}
                        <div className="px-6 py-2.5 border-y border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3 text-xs">
                            {/* Status Popover */}
                            <div className="relative">
                                <span className="text-gray-400 font-medium mr-1.5">Status:</span>
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setShowStatusPop(!showStatusPop)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md font-semibold text-gray-800 shadow-2xs hover:border-gray-300 transition cursor-pointer"
                                    style={{
                                        borderLeftWidth: '3px',
                                        borderLeftColor: currentStatus?.color || '#3b82f6',
                                    }}
                                >
                                    <span>{currentStatus?.name || 'Status'}</span>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </button>

                                {showStatusPop && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowStatusPop(false)} />
                                        <div className="absolute z-20 top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-xl p-2 space-y-1">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search status..."
                                                    value={statusSearch}
                                                    onChange={e => setStatusSearch(e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                                                {allStatuses
                                                    .filter(s => s.name.toLowerCase().includes(statusSearch.toLowerCase()))
                                                    .map(st => (
                                                        <button
                                                            key={st.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, statusId: st.id });
                                                                setShowStatusPop(false);
                                                            }}
                                                            className={cn(
                                                                'w-full px-2.5 py-1.5 text-left text-xs rounded-md flex items-center justify-between transition',
                                                                formData.statusId === st.id ? 'bg-red-50 text-red-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                                                                <span>{st.name}</span>
                                                            </div>
                                                            {formData.statusId === st.id && <Check className="w-3.5 h-3.5 text-red-600" />}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Type Popover */}
                            <div className="relative">
                                <span className="text-gray-400 font-medium mr-1.5">Type:</span>
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setShowTypePop(!showTypePop)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold border text-xs transition shadow-2xs cursor-pointer',
                                        currentTypeOpt.bg, currentTypeOpt.color
                                    )}
                                >
                                    <TypeIcon className="w-3.5 h-3.5" />
                                    <span>{currentTypeOpt.label}</span>
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                </button>

                                {showTypePop && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowTypePop(false)} />
                                        <div className="absolute z-20 top-full mt-1 left-0 w-44 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 space-y-0.5">
                                            {ISSUE_TYPE_OPTIONS.map(opt => {
                                                const Icon = opt.icon;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, type: opt.value });
                                                            setShowTypePop(false);
                                                        }}
                                                        className={cn(
                                                            'w-full px-2.5 py-1.5 text-left text-xs rounded-md flex items-center justify-between transition',
                                                            formData.type === opt.value ? 'bg-purple-50 text-purple-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={cn('w-3.5 h-3.5', opt.color)} />
                                                            <span>{opt.label}</span>
                                                        </div>
                                                        {formData.type === opt.value && <Check className="w-3.5 h-3.5 text-purple-600" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Priority Popover */}
                            <div className="relative">
                                <span className="text-gray-400 font-medium mr-1.5">Priority:</span>
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setShowPrioPop(!showPrioPop)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-md font-semibold text-xs shadow-2xs transition cursor-pointer',
                                        currentPrioOpt.bg, currentPrioOpt.color
                                    )}
                                >
                                    <span>{currentPrioOpt.icon} {currentPrioOpt.label}</span>
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                </button>

                                {showPrioPop && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowPrioPop(false)} />
                                        <div className="absolute z-20 top-full mt-1 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 space-y-0.5">
                                            {PRIORITY_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, priority: opt.value });
                                                        setShowPrioPop(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-2.5 py-1.5 text-left text-xs rounded-md flex items-center justify-between transition',
                                                        formData.priority === opt.value ? 'bg-red-50 font-bold' : 'hover:bg-gray-50 text-gray-700'
                                                    )}
                                                >
                                                    <span className={opt.color}>{opt.icon} {opt.label}</span>
                                                    {formData.priority === opt.value && <Check className="w-3.5 h-3.5 text-red-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="px-6 border-b border-gray-200 flex space-x-6 text-sm bg-white">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={cn(
                                    'py-3 font-medium border-b-2 transition text-xs tracking-wide uppercase',
                                    activeTab === 'details'
                                        ? 'border-red-600 text-red-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={cn(
                                    'py-3 font-medium border-b-2 transition text-xs tracking-wide uppercase flex items-center gap-1.5',
                                    activeTab === 'history'
                                        ? 'border-red-600 text-red-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <History className="w-3.5 h-3.5" /> Status History ({issue.statusHistory?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('attachments')}
                                className={cn(
                                    'py-3 font-medium border-b-2 transition text-xs tracking-wide uppercase flex items-center gap-1.5',
                                    activeTab === 'attachments'
                                        ? 'border-red-600 text-red-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <Paperclip className="w-3.5 h-3.5" /> Attachments ({issue.attachments?.length || 0})
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTab === 'details' && (
                                <>
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <AlignLeft className="w-4 h-4 text-gray-400" /> Description / Steps to Reproduce
                                        </h3>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            disabled={isReadOnly}
                                            placeholder="No description provided..."
                                            className="w-full p-3 bg-gray-50/60 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
                                        />
                                    </div>

                                    {/* Expected vs Actual Output */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Expected Output
                                            </h3>
                                            <textarea
                                                rows={3}
                                                value={formData.expectedOutput}
                                                onChange={e => setFormData({ ...formData, expectedOutput: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="What was expected to happen..."
                                                className="w-full p-3 bg-emerald-50/30 border border-emerald-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <AlertCircle className="w-4 h-4 text-red-500" /> Actual Output
                                            </h3>
                                            <textarea
                                                rows={3}
                                                value={formData.actualOutput}
                                                onChange={e => setFormData({ ...formData, actualOutput: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="What actually happened..."
                                                className="w-full p-3 bg-red-50/30 border border-red-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Interactive Metadata Cards Grid */}
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-100 text-xs">
                                        {/* Phase Card */}
                                        <div className="relative bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-gray-400 font-semibold flex items-center gap-1">
                                                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> Phase
                                                </span>
                                                {!isReadOnly && phases.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPhasePop(!showPhasePop)}
                                                        className="text-[10px] text-indigo-600 font-semibold hover:underline"
                                                    >
                                                        Change
                                                    </button>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-800 uppercase block truncate">
                                                {selectedPhase?.name || issue.phaseName || '—'}
                                            </span>

                                            {showPhasePop && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowPhasePop(false)} />
                                                    <div className="absolute z-20 left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto">
                                                        <input
                                                            type="text"
                                                            placeholder="Filter phase..."
                                                            value={phaseSearch}
                                                            onChange={e => setPhaseSearch(e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border rounded mb-1 focus:outline-none"
                                                        />
                                                        {filteredPhases.map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, phaseId: p.id, taskListId: undefined });
                                                                    setShowPhasePop(false);
                                                                }}
                                                                className={cn(
                                                                    'w-full px-2 py-1 text-left text-xs rounded hover:bg-indigo-50 block truncate',
                                                                    formData.phaseId === p.id && 'font-bold text-indigo-600'
                                                                )}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Task List Card */}
                                        <div className="relative bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-gray-400 font-semibold flex items-center gap-1">
                                                    <ListTodo className="w-3.5 h-3.5 text-emerald-500" /> Task List
                                                </span>
                                                {!isReadOnly && availableTaskLists.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTaskListPop(!showTaskListPop)}
                                                        className="text-[10px] text-emerald-600 font-semibold hover:underline"
                                                    >
                                                        Change
                                                    </button>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-800 uppercase block truncate">
                                                {selectedTaskList?.name || issue.taskListName || '—'}
                                            </span>

                                            {showTaskListPop && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowTaskListPop(false)} />
                                                    <div className="absolute z-20 left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto">
                                                        {filteredTaskLists.map(tl => (
                                                            <button
                                                                key={tl.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, taskListId: tl.id });
                                                                    setShowTaskListPop(false);
                                                                }}
                                                                className={cn(
                                                                    'w-full px-2 py-1 text-left text-xs rounded hover:bg-emerald-50 block truncate',
                                                                    formData.taskListId === tl.id && 'font-bold text-emerald-600'
                                                                )}
                                                            >
                                                                {tl.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Linked Task Card */}
                                        <div className="relative bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-gray-400 font-semibold flex items-center gap-1">
                                                    <Link2 className="w-3.5 h-3.5 text-blue-500" /> Linked Task
                                                </span>
                                                {!isReadOnly && tasks.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTaskPop(!showTaskPop)}
                                                        className="text-[10px] text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Link
                                                    </button>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-800 block truncate">
                                                {selectedTask?.title || '—'}
                                            </span>

                                            {showTaskPop && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setShowTaskPop(false)} />
                                                    <div className="absolute z-20 left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, taskId: undefined });
                                                                setShowTaskPop(false);
                                                            }}
                                                            className="w-full px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50 rounded italic"
                                                        >
                                                            Unlink task
                                                        </button>
                                                        {filteredTasks.map(t => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, taskId: t.id });
                                                                    setShowTaskPop(false);
                                                                }}
                                                                className={cn(
                                                                    'w-full px-2 py-1 text-left text-xs rounded hover:bg-blue-50 block truncate',
                                                                    formData.taskId === t.id && 'font-bold text-blue-600'
                                                                )}
                                                            >
                                                                {t.title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Due Date Card */}
                                        <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-gray-400 font-semibold flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-amber-500" /> Due Date
                                                </span>
                                            </div>
                                            {!isReadOnly ? (
                                                <input
                                                    type="date"
                                                    value={formData.dueDate || ''}
                                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                                    className="font-bold text-gray-800 bg-transparent text-xs border-none p-0 focus:outline-none"
                                                />
                                            ) : (
                                                <span className="font-bold text-gray-800 block">
                                                    {formData.dueDate ? formatDate(formData.dueDate) : '—'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assignees Section - Styled to match CreateIssueModal */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-gray-400" /> Assignees
                                        </label>

                                        {selectedAssignees.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {selectedAssignees.map(a => (
                                                    <span
                                                        key={a.id}
                                                        className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700 shadow-2xs"
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase overflow-hidden shrink-0",
                                                                getAvatarColor(a.name)
                                                            )}
                                                        >
                                                            {a.avatarUrl ? (
                                                                <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                a.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <span>{a.name}</span>
                                                        {!isReadOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleAssignee(a.id)}
                                                                className="ml-0.5 p-0.5 hover:bg-indigo-100 rounded-full transition-colors text-indigo-600"
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
                                                    onClick={() => setShowAssigneePop(!showAssigneePop)}
                                                    className="w-full px-3 py-2.5 border border-gray-200 border-dashed rounded-md text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left flex items-center gap-2"
                                                >
                                                    <Users className="w-3.5 h-3.5" />
                                                    {selectedAssignees.length === 0 ? 'Click to assign team members...' : 'Add more...'}
                                                </button>

                                                {showAssigneePop && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setShowAssigneePop(false)} />
                                                        <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-52 overflow-hidden flex flex-col">
                                                            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        placeholder="Search team members..."
                                                                        value={assigneeSearch}
                                                                        onChange={e => setAssigneeSearch(e.target.value)}
                                                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                                                {filteredMembers.map(m => {
                                                                    const u = m?.user || m;
                                                                    const uid = u?.id || m?.userId || m?.id;
                                                                    const name = u?.name || u?.email || 'User';
                                                                    const isAssigned = (formData.assigneeIds || []).includes(uid);
                                                                    const avatarUrl = u?.avatarUrl;

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
                                                                                    className={cn(
                                                                                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase overflow-hidden shrink-0",
                                                                                        getAvatarColor(name)
                                                                                    )}
                                                                                >
                                                                                    {avatarUrl ? (
                                                                                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
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
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Audit Trail
                                    </h3>
                                    <div className="relative border-l-2 border-gray-200 pl-4 space-y-4 ml-2">
                                        {issue.statusHistory?.map((entry, index) => (
                                            <div key={index} className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white shadow-2xs" />
                                                <div className="text-xs text-gray-800 font-medium">
                                                    <span className="font-bold text-gray-900">{entry.user?.name || 'System'}</span> changed status to{' '}
                                                    <span
                                                        className="px-2 py-0.5 rounded text-[11px] font-bold text-white inline-block shadow-2xs"
                                                        style={{ backgroundColor: entry.status?.color || '#3b82f6' }}
                                                    >
                                                        {entry.status?.name}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {formatDate(entry.changedAt)}
                                                </div>
                                            </div>
                                        ))}
                                        {(!issue.statusHistory || issue.statusHistory.length === 0) && (
                                            <p className="text-xs text-gray-400 italic">No status history recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attachments' && (
                                <div className="space-y-4">
                                    {!isReadOnly && (
                                        <div className="relative border-2 border-dashed border-gray-200 hover:border-red-400 rounded-xl p-6 text-center transition cursor-pointer bg-gray-50/50 group">
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 group-hover:text-red-500 transition mb-2" />
                                            <p className="text-xs font-semibold text-gray-700">
                                                {isUploading ? 'Uploading files...' : 'Click or drag files here to attach'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPG, PDF, ZIP up to 25MB</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {issue.attachments?.map(att => (
                                            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-lg border border-gray-200 transition shadow-2xs">
                                                <div className="flex items-center gap-2 truncate">
                                                    <Paperclip className="w-4 h-4 text-red-500 shrink-0" />
                                                    <span className="text-xs font-medium text-gray-800 truncate">{att.fileName}</span>
                                                    {att.fileSize && (
                                                        <span className="text-[10px] text-gray-400 shrink-0">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <a
                                                        href={att.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-red-600 font-semibold hover:underline"
                                                    >
                                                        View
                                                    </a>
                                                    {!isReadOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await removeAttachmentMutation.mutateAsync({ issueId, attachmentId: att.id });
                                                                    toast.success('Attachment deleted');
                                                                } catch (err) {
                                                                    toast.error('Failed to delete attachment');
                                                                }
                                                            }}
                                                            className="text-gray-400 hover:text-red-600 transition"
                                                            title="Delete attachment"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!issue.attachments || issue.attachments.length === 0) && (
                                            <p className="text-xs text-gray-400 italic text-center py-4">No attachments uploaded yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer Bar with Update Issue Button */}
                        {!isReadOnly && (
                            <div className="px-6 py-3.5 border-t border-gray-200 bg-white flex items-center justify-between shadow-xs shrink-0">
                                <span className="text-xs text-gray-500 font-medium">
                                    Click Update Issue to apply changes
                                </span>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                    >
                                        {updateMutation.isPending ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <span>Update Issue</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <h3 className="text-base font-bold text-gray-900">Delete Issue?</h3>
                        <p className="text-xs text-gray-600">
                            Are you sure you want to delete this issue? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-xs text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-1.5 text-xs text-white font-semibold bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
