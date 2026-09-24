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
    Eye,
    Download,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    FileImage,
    File,
    FileArchive,
    Info,
} from 'lucide-react';
import { cn, getAvatarColor, formatDate, getFileUrl } from '@/lib/utils';
import type { Issue, IssueType, IssueSeverity, IssuePriority, UpdateIssuePayload } from '@/types/issue';
import type { Task, WorkflowStage } from '@/types/task';
import type { ProjectMember } from '@/types/project';
import type { PhaseWithTaskLists } from '@/types/phase';
import { useIssueDetail, useUpdateIssue, useDeleteIssue, useAddIssueAttachment, useRemoveIssueAttachment } from '@/hooks/use-issues';
import { useToast } from '@/components/ui/Toast';
import { useUser } from '@/hooks/use-auth';
import { useOrgStore } from '@/stores/orgStore';

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

interface AttachmentPreviewData {
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
}

function AttachmentPreviewModal({
    attachment,
    onClose,
}: {
    attachment: AttachmentPreviewData | null;
    onClose: () => void;
}) {
    if (!attachment) return null;

    const { fileName, fileUrl, mimeType, fileSize } = attachment;
    const resolvedUrl = getFileUrl(fileUrl);
    const lowerName = fileName.toLowerCase();

    const isImage = mimeType?.startsWith('image/') ||
        fileUrl.startsWith('data:image/') ||
        /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(lowerName);

    const isPdf = mimeType === 'application/pdf' ||
        fileUrl.startsWith('data:application/pdf') ||
        lowerName.endsWith('.pdf');

    const isExcel = mimeType?.includes('excel') ||
        mimeType?.includes('spreadsheet') ||
        /\.(xlsx?|csv)$/i.test(lowerName);

    const isWordDoc = mimeType?.includes('word') ||
        mimeType?.includes('officedocument') ||
        /\.(docx?)$/i.test(lowerName);

    const isHttpUrl = resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://');

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/90">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-4">
                        {isImage && <FileImage className="w-5 h-5 text-purple-600 shrink-0" />}
                        {isPdf && <FileText className="w-5 h-5 text-red-600 shrink-0" />}
                        {isExcel && <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />}
                        {isWordDoc && <FileText className="w-5 h-5 text-blue-600 shrink-0" />}
                        {!isImage && !isPdf && !isExcel && !isWordDoc && <File className="w-5 h-5 text-gray-500 shrink-0" />}

                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-gray-900 truncate" title={fileName}>{fileName}</h3>
                            {fileSize && (
                                <span className="text-[10px] text-gray-400 block font-medium">{(fileSize / 1024).toFixed(1)} KB</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={resolvedUrl}
                            download={fileName}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition"
                            title="Download file"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-500" /> Download
                        </a>

                        <a
                            href={resolvedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition"
                            title="Open in new window"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500" /> Open External
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 bg-gray-900/5 p-4 overflow-auto flex items-center justify-center min-h-[450px]">
                    {isImage ? (
                        <img
                            src={resolvedUrl}
                            alt={fileName}
                            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md border border-gray-200"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={resolvedUrl}
                            className="w-full h-[75vh] rounded-lg border border-gray-200 bg-white"
                            title={fileName}
                        />
                    ) : (isExcel || isWordDoc) && isHttpUrl ? (
                        <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true`}
                            className="w-full h-[75vh] rounded-lg border border-gray-200 bg-white"
                            title={fileName}
                        />
                    ) : (
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                                {isExcel ? <FileSpreadsheet className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 truncate mb-1">{fileName}</h4>
                                <p className="text-xs text-gray-500">
                                    Direct in-app preview is optimized for images, PDFs, and web documents. Click below to view or download.
                                </p>
                            </div>
                            <div className="pt-2 flex justify-center gap-3">
                                <a
                                    href={resolvedUrl}
                                    download={fileName}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 shadow-xs"
                                >
                                    <Download className="w-4 h-4" /> Download File
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

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
    const { data: user } = useUser();
    const { data: issue, isLoading } = useIssueDetail(issueId || '');
    const updateMutation = useUpdateIssue(projectId);
    const deleteMutation = useDeleteIssue(projectId);
    const addAttachmentMutation = useAddIssueAttachment(projectId);
    const removeAttachmentMutation = useRemoveIssueAttachment(projectId);

    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'attachments'>('details');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewData | null>(null);

    // Permission check for delete action: Only OWNER or ADMIN can delete issue
    const currentUserMember = useMemo(() => {
        if (!user || !members.length) return null;
        return members.find(m => {
            const uid = m?.user?.id || m?.userId || m?.id;
            return uid === user.id;
        });
    }, [user, members]);

    const userRole = currentUserMember?.role || (user as any)?.role || (useOrgStore.getState() as any).currentRole || (useOrgStore.getState() as any).role;
    const canDelete = userRole === 'OWNER' || userRole === 'ADMIN';

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

    // Popover Toggles
    const [showPhasePop, setShowPhasePop] = useState(false);
    const [phaseSearch, setPhaseSearch] = useState('');
    const [showTaskListPop, setShowTaskListPop] = useState(false);
    const [showTaskPop, setShowTaskPop] = useState(false);
    const [showAssigneePop, setShowAssigneePop] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    useEffect(() => {
        if (issue) {
            setFormData({
                title: issue.title,
                description: issue.description || '',
                expectedOutput: issue.expectedOutput || '',
                actualOutput: issue.actualOutput || '',
                type: issue.type || 'BUG',
                priority: (issue.priority as IssuePriority) || 3,
                statusId: issue.status?.id || '',
                phaseId: issue.phaseId || undefined,
                taskListId: issue.taskListId || undefined,
                taskId: issue.taskId || undefined,
                dueDate: issue.dueDate ? issue.dueDate.split('T')[0] : undefined,
                assigneeIds: issue.assignees?.map(a => a.id) || [],
            });
        }
    }, [issue]);

    const allStatuses = useMemo(() =>
        workflow.flatMap(stage =>
            stage.statuses.map(status => ({ ...status, stageName: stage.name }))
        ),
        [workflow]
    );

    const selectedPhase = phases.find(p => p.id === formData.phaseId);
    const availableTaskLists = selectedPhase?.taskLists || [];
    const selectedTaskList = availableTaskLists.find(tl => tl.id === formData.taskListId);
    const selectedTask = tasks.find(t => t.id === formData.taskId);

    const currentStatus = useMemo(() =>
        allStatuses.find(s => s.id === formData.statusId),
        [allStatuses, formData.statusId]
    );
    const statusColor = currentStatus?.color || '#3b82f6';

    const currentPriority = useMemo(() =>
        PRIORITY_OPTIONS.find(p => p.value === formData.priority) || PRIORITY_OPTIONS[2],
        [formData.priority]
    );

    const currentTypeOption = useMemo(() =>
        ISSUE_TYPE_OPTIONS.find(t => t.value === formData.type) || ISSUE_TYPE_OPTIONS[0],
        [formData.type]
    );

    const TypeIcon = currentTypeOption.icon;

    const filteredPhases = useMemo(() => {
        if (!phaseSearch.trim()) return phases;
        return phases.filter(p => p.name.toLowerCase().includes(phaseSearch.toLowerCase()));
    }, [phases, phaseSearch]);

    const filteredTaskLists = availableTaskLists;

    const filteredTasks = useMemo(() => {
        if (!formData.phaseId) return tasks;
        return tasks.filter(t => t.phaseId === formData.phaseId);
    }, [tasks, formData.phaseId]);

    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return members;
        const q = assigneeSearch.toLowerCase();
        return members.filter(m => {
            const u = m?.user || m;
            const name = u?.name || '';
            const email = u?.email || '';
            return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
        });
    }, [members, assigneeSearch]);

    const selectedAssignees = useMemo(() => {
        const ids = formData.assigneeIds || [];
        return members
            .map(m => m?.user || m)
            .filter(u => u && ids.includes(u.id || (u as any).userId));
    }, [members, formData.assigneeIds]);

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
        if (!issueId || !formData.title?.trim()) {
            toast.error('Title is required');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                issueId,
                data: {
                    ...formData,
                    dueDate: formData.dueDate ? formData.dueDate : undefined,
                },
            });
            toast.success('Issue updated successfully');
        } catch (err: any) {
            toast.error('Failed to update issue', err.message);
        }
    };

    const handleDelete = async () => {
        if (!issueId) return;
        try {
            await deleteMutation.mutateAsync(issueId);
            toast.success('Issue deleted successfully');
            setShowDeleteConfirm(false);
            onClose();
        } catch (err: any) {
            toast.error('Failed to delete issue', err.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !issueId) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const fileUrl = event.target?.result as string;
                    await addAttachmentMutation.mutateAsync({
                        issueId,
                        data: {
                            fileName: file.name,
                            fileUrl: fileUrl,
                            mimeType: file.type,
                            fileSize: file.size,
                        },
                    });
                };
                reader.readAsDataURL(file);
            }
            toast.success('Attachments added successfully');
        } catch (err: any) {
            toast.error('Failed to upload attachments');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 border-l border-gray-100">
                {/* Header Bar */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/80">
                    <div className="flex items-center space-x-3">
                        <span className={cn("text-xs font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5 uppercase border", currentTypeOption.bg, currentTypeOption.color)}>
                            <TypeIcon className={cn("w-3.5 h-3.5", currentTypeOption.color)} />
                            {issue?.issueId || 'ISSUE'}
                        </span>
                        {issue?.projectName && (
                            <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200/60 uppercase tracking-tight">
                                {issue.projectName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isReadOnly && canDelete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Issue (Owner/Admin only)"
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
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                disabled={isReadOnly}
                                className="w-full text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-red-500 focus:outline-none transition py-1 bg-transparent"
                                placeholder="Issue Title..."
                            />
                        </div>

                        {/* Status, Priority & Issue Type Selectors with Dynamic Colors */}
                        <div className="px-6 py-2.5 bg-gray-50/60 border-y border-gray-100 flex items-center flex-wrap gap-3">
                            {/* Dynamic Status Dropdown */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
                                <select
                                    value={formData.statusId}
                                    onChange={e => setFormData({ ...formData, statusId: e.target.value })}
                                    disabled={isReadOnly}
                                    className="px-3 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase border focus:outline-none transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: `${statusColor}18`,
                                        color: statusColor,
                                        borderColor: `${statusColor}40`,
                                    }}
                                >
                                    {allStatuses.map(s => (
                                        <option key={s.id} value={s.id} className="text-gray-900 bg-white font-medium uppercase">
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Priority Dropdown */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority:</span>
                                <select
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) as IssuePriority })}
                                    disabled={isReadOnly}
                                    className={cn(
                                        "px-3 py-1.5 border rounded-md text-xs font-bold transition-all cursor-pointer focus:outline-none",
                                        currentPriority.bg, currentPriority.color
                                    )}
                                >
                                    {PRIORITY_OPTIONS.map(p => (
                                        <option key={p.value} value={p.value} className="text-gray-900 bg-white font-medium">
                                            {p.icon} {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Issue Type Dropdown */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type:</span>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as IssueType })}
                                    disabled={isReadOnly}
                                    className={cn(
                                        "px-3 py-1.5 border rounded-md text-xs font-bold uppercase transition-all cursor-pointer focus:outline-none",
                                        currentTypeOption.bg, currentTypeOption.color
                                    )}
                                >
                                    {ISSUE_TYPE_OPTIONS.map(t => (
                                        <option key={t.value} value={t.value} className="text-gray-900 bg-white font-medium uppercase">
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="px-6 border-b border-gray-200 flex space-x-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={cn(
                                    'py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5',
                                    activeTab === 'details'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <AlignLeft className="w-3.5 h-3.5" /> Details
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={cn(
                                    'py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5',
                                    activeTab === 'history'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <History className="w-3.5 h-3.5" /> Status History
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('attachments')}
                                className={cn(
                                    'py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5',
                                    activeTab === 'attachments'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <Paperclip className="w-3.5 h-3.5" /> Attachments ({issue.attachments?.length || 0})
                            </button>
                        </div>

                        {/* Tab Content Area */}
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

                                    {/* Assignees Section */}
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
                                                        <div className="fixed inset-0 z-20" onClick={() => setShowAssigneePop(false)} />
                                                        <div className="absolute z-30 bottom-full mb-1 w-full bg-white rounded-md border border-gray-200 shadow-xl max-h-52 overflow-hidden flex flex-col">
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

                                    {/* Attachments & Screenshots Quick Grid in Details Tab */}
                                    {issue.attachments && issue.attachments.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Paperclip className="w-4 h-4 text-indigo-500" /> Issue Attachments ({issue.attachments.length})
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                {issue.attachments.map(att => {
                                                    const lowerName = att.fileName.toLowerCase();
                                                    const isImage = att.mimeType?.startsWith('image/') ||
                                                        att.fileUrl.startsWith('data:image/') ||
                                                        /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerName);
                                                    const isPdf = att.mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
                                                    const isExcel = att.mimeType?.includes('excel') || /\.(xlsx?|csv)$/i.test(lowerName);
                                                    const resolvedUrl = getFileUrl(att.fileUrl);

                                                    return (
                                                        <div
                                                            key={att.id}
                                                            onClick={() => setPreviewAttachment({
                                                                fileName: att.fileName,
                                                                fileUrl: att.fileUrl,
                                                                mimeType: att.mimeType,
                                                                fileSize: att.fileSize,
                                                            })}
                                                            className="p-2.5 bg-gray-50/80 hover:bg-indigo-50/60 border border-gray-200 hover:border-indigo-300 rounded-lg transition cursor-pointer group flex items-center gap-2.5"
                                                        >
                                                            {isImage ? (
                                                                <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden border border-purple-200">
                                                                    <img src={resolvedUrl} alt={att.fileName} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : isPdf ? (
                                                                <FileText className="w-6 h-6 text-red-500 shrink-0" />
                                                            ) : isExcel ? (
                                                                <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <Paperclip className="w-6 h-6 text-indigo-500 shrink-0" />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 truncate" title={att.fileName}>
                                                                    {att.fileName}
                                                                </p>
                                                                <span className="text-[10px] text-indigo-500 font-medium flex items-center gap-0.5 mt-0.5">
                                                                    <Eye className="w-2.5 h-2.5" /> Click to view
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
                                    {/* Supported Formats Banner */}
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-indigo-500" /> Supported File Formats
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">Max size: 25MB per file</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                                                <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">Images</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">PNG, JPG, WEBP, GIF</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                                                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">Documents</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">PDF, DOC, DOCX</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">Spreadsheets</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">XLS, XLSX, CSV</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                                                <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">Logs & Archives</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">TXT, LOG, ZIP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isReadOnly && (
                                        <div className="relative border-2 border-dashed border-gray-200 hover:border-red-400 rounded-xl p-5 text-center transition cursor-pointer bg-gray-50/50 group">
                                            <input
                                                type="file"
                                                multiple
                                                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.zip"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <Upload className="w-7 h-7 mx-auto text-gray-400 group-hover:text-red-500 transition mb-1.5" />
                                            <p className="text-xs font-semibold text-gray-700">
                                                {isUploading ? 'Uploading files...' : 'Click or drag files here to attach'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Supports Images, Documents, Spreadsheets, Logs & Archives (Up to 25MB)</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {issue.attachments?.map(att => {
                                            const lowerName = att.fileName.toLowerCase();
                                            const isImage = att.mimeType?.startsWith('image/') ||
                                                att.fileUrl.startsWith('data:image/') ||
                                                /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerName);
                                            const isPdf = att.mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
                                            const isExcel = att.mimeType?.includes('excel') || /\.(xlsx?|csv)$/i.test(lowerName);
                                            const resolvedUrl = getFileUrl(att.fileUrl);

                                            return (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-lg border border-gray-200 transition shadow-2xs">
                                                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                                        {isImage ? (
                                                            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden border border-purple-200">
                                                                <img src={resolvedUrl} alt={att.fileName} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : isPdf ? (
                                                            <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                                        ) : isExcel ? (
                                                            <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <Paperclip className="w-5 h-5 text-indigo-500 shrink-0" />
                                                        )}
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-xs font-semibold text-gray-800 truncate">{att.fileName}</span>
                                                            {att.fileSize && (
                                                                <span className="text-[10px] text-gray-400 shrink-0">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewAttachment({
                                                                fileName: att.fileName,
                                                                fileUrl: att.fileUrl,
                                                                mimeType: att.mimeType,
                                                                fileSize: att.fileSize,
                                                            })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> View
                                                        </button>
                                                        <a
                                                            href={resolvedUrl}
                                                            download={att.fileName}
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                            title="Download file"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                        {!isReadOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    try {
                                                                        if (issueId) {
                                                                            await removeAttachmentMutation.mutateAsync({ issueId, attachmentId: att.id });
                                                                            toast.success('Attachment deleted');
                                                                        }
                                                                    } catch (err) {
                                                                        toast.error('Failed to delete attachment');
                                                                    }
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 transition"
                                                                title="Delete attachment"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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

            {/* File Attachment Viewer Modal */}
            <AttachmentPreviewModal
                attachment={previewAttachment}
                onClose={() => setPreviewAttachment(null)}
            />
        </div>
    );
}
