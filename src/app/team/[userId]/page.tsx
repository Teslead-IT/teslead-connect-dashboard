'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    ChevronDown,
    ChevronRight,
    ListTodo,
    Filter,
    Calendar,
    Stars,
    Bug,
    Zap,
    RefreshCw,
    FlaskConical,
    FileText,
    Settings,
    ClipboardCheck,
    Flame,
    ExternalLink,
    X,
} from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { useTeams } from '@/hooks/use-teams';
import { useUserTasks, taskKeys, useProjectWorkflow } from '@/hooks/use-tasks';
import { useStructuredPhases } from '@/hooks/use-phases';
import { useProjectMembers, useProjects } from '@/hooks/use-projects';
import { taskService, workflowService } from '@/services/tasks.service';
import { Avatar } from '@/components/ui/Avatar';
import { Loader } from '@/components/ui/Loader';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { cn } from '@/lib/utils';
import type { MyTask } from '@/types/task';

const TASK_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    FEAT: { label: 'FEAT', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Stars },
    BUG: { label: 'BUG', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: Bug },
    IMPR: { label: 'IMPR', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Zap },
    REF: { label: 'REF', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: RefreshCw },
    RND: { label: 'R&D', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: FlaskConical },
    DOC: { label: 'DOC', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: FileText },
    OPS: { label: 'OPS', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: Settings },
    TEST: { label: 'TEST', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: ClipboardCheck },
    HOT: { label: 'HOT', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Flame },
};

function StatusFilterDropdown({
    selectedStatusId,
    statusOptions,
    onChange,
}: {
    selectedStatusId: string;
    statusOptions: Array<{ id: string; name: string; color: string }>;
    onChange: (statusId: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeOption = statusOptions.find((st) => st.id === selectedStatusId);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-all shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {activeOption ? (
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: activeOption.color }}
                        />
                        <span className="truncate max-w-[110px]">{activeOption.name}</span>
                    </span>
                ) : (
                    <span className="text-gray-700">All Statuses</span>
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in-50 zoom-in-95">
                    <button
                        type="button"
                        onClick={() => {
                            onChange('ALL');
                            setIsOpen(false);
                        }}
                        className={cn(
                            "w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer",
                            selectedStatusId === 'ALL' ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700"
                        )}
                    >
                        <span>All Statuses</span>
                        {selectedStatusId === 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <div className="max-h-52 overflow-y-auto">
                        {statusOptions.map((st) => {
                            const isSelected = selectedStatusId === st.id;
                            return (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(st.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer",
                                        isSelected ? "bg-gray-50 font-bold" : "text-gray-700"
                                    )}
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: st.color }}
                                    />
                                    <span className="truncate flex-1">{st.name}</span>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function DateFilterDropdown({
    dateFilter,
    onChangeFilter,
    customStartDate,
    customEndDate,
    onStartDateChange,
    onEndDateChange,
}: {
    dateFilter: string;
    onChangeFilter: (val: string) => void;
    customStartDate: string;
    customEndDate: string;
    onStartDateChange: (val: string) => void;
    onEndDateChange: (val: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const DATE_OPTIONS = [
        { id: 'ALL', label: 'All Dates' },
        { id: 'TODAY', label: 'Due Today' },
        { id: 'THIS_WEEK', label: 'Due This Week' },
        { id: 'THIS_MONTH', label: 'Due This Month' },
        { id: 'OVERDUE', label: 'Overdue Tasks' },
        { id: 'CUSTOM', label: 'Custom Range' },
    ];

    const currentLabel = DATE_OPTIONS.find((o) => o.id === dateFilter)?.label || 'All Dates';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-all shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{dateFilter === 'ALL' ? 'Date Filter' : currentLabel}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in-50 zoom-in-95">
                    {DATE_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                                onChangeFilter(opt.id);
                                if (opt.id !== 'CUSTOM') setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer",
                                dateFilter === opt.id ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700"
                            )}
                        >
                            <span>{opt.label}</span>
                            {dateFilter === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </button>
                    ))}

                    {dateFilter === 'CUSTOM' && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">From Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => onStartDateChange(e.target.value)}
                                    className="w-full mt-0.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">To Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => onEndDateChange(e.target.value)}
                                    className="w-full mt-0.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-full mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                Apply Filter
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function TaskModalWrapper({
    isOpen,
    onClose,
    projectId,
    taskId,
    onTaskUpdated,
}: {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    taskId: string;
    onTaskUpdated: () => void;
}) {
    const { data: phases = [] } = useStructuredPhases(projectId);
    const { data: members = [] } = useProjectMembers(projectId);
    const { data: workflow = [] } = useProjectWorkflow(projectId);

    return (
        <TaskViewModal
            isOpen={isOpen}
            onClose={onClose}
            projectId={projectId}
            phases={phases}
            selectedTaskId={taskId}
            workflow={workflow}
            members={members}
            onUpdateTask={async (tId, data) => {
                await taskService.updateTask(tId, data);
            }}
            onDeleteTask={async (tId) => {
                await taskService.deleteTask(tId);
            }}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskUpdated}
        />
    );
}

export default function UserTasksPage() {
    const params = useParams();
    const router = useRouter();
    const userId = (params?.userId as string) || '';

    const { teams } = useTeams();
    const userMember = useMemo(() => {
        return teams.find((m) => m.user.id === userId);
    }, [teams, userId]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter] = useState<string>('ALL');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

    const [taskModalState, setTaskModalState] = useState<{
        isOpen: boolean;
        taskId: string | null;
        projectId: string | null;
    }>({
        isOpen: false,
        taskId: null,
        projectId: null,
    });

    const { data: userTasksData, isLoading, refetch } = useUserTasks(userId, {
        limit: 100,
        search: searchQuery || undefined,
    });

    const rawTasks: MyTask[] = userTasksData?.data || [];

    // Collect project IDs from user's tasks to fetch workflows via GET /projects/:projectId/workflow
    const projectIds = useMemo(() => {
        const ids = new Set<string>();
        rawTasks.forEach((t) => { if (t.projectId) ids.add(t.projectId); });
        return Array.from(ids);
    }, [rawTasks]);

    const workflowQueries = useQueries({
        queries: projectIds.map((pId) => ({
            queryKey: taskKeys.workflow(pId),
            queryFn: () => workflowService.getWorkflow(pId),
            enabled: !!pId,
            staleTime: 60 * 1000,
        })),
    });

    // Extract unique status options (deduplicated by status NAME to remove duplicate entries across projects)
    const statusOptions = useMemo(() => {
        const map = new Map<string, { id: string; name: string; color: string; ids: Set<string> }>();

        const addStatus = (id: string, name: string, color?: string) => {
            if (!name || !name.trim()) return;
            const key = name.trim().toLowerCase();
            if (!map.has(key)) {
                map.set(key, {
                    id: id || key,
                    name: name.trim(),
                    color: color || '#64748b',
                    ids: new Set(id ? [id] : []),
                });
            } else {
                const existing = map.get(key)!;
                if (id) existing.ids.add(id);
                if (color && color !== '#64748b') existing.color = color;
            }
        };

        // 1. Add statuses from user's tasks
        rawTasks.forEach((t) => {
            if (t.status?.name) {
                addStatus(t.status.id, t.status.name, t.status.color);
            }
        });

        // 2. Add workflow statuses from project workflows (GET /projects/:projectId/workflow)
        workflowQueries.forEach((q) => {
            if (q.data && Array.isArray(q.data)) {
                q.data.forEach((stage: any) => {
                    if (stage.statuses && Array.isArray(stage.statuses)) {
                        stage.statuses.forEach((st: any) => {
                            addStatus(st.id, st.name, st.color);
                        });
                    }
                });
            }
        });

        return Array.from(map.values());
    }, [workflowQueries, rawTasks]);

    // Comprehensive client filtering (Search + Date + Status)
    const filteredTasks = useMemo(() => {
        let result = rawTasks;

        // 1. Status Filter
        if (selectedStatusFilter !== 'ALL') {
            const selectedOpt = statusOptions.find(
                (s) => s.id === selectedStatusFilter || s.name.toLowerCase() === selectedStatusFilter.toLowerCase()
            );
            if (selectedOpt) {
                result = result.filter(
                    (task) =>
                        (task.status?.id && selectedOpt.ids.has(task.status.id)) ||
                        (task.status?.name && task.status.name.trim().toLowerCase() === selectedOpt.name.toLowerCase())
                );
            } else {
                result = result.filter((task) => task.status?.id === selectedStatusFilter);
            }
        }

        // 2. Date Filter
        if (dateFilter !== 'ALL') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result = result.filter((task) => {
                if (!task.dueDate) return false;
                const dueDay = new Date(task.dueDate);
                dueDay.setHours(0, 0, 0, 0);

                if (dateFilter === 'TODAY') {
                    return dueDay.getTime() === today.getTime();
                }
                if (dateFilter === 'OVERDUE') {
                    const statusLower = (task.status?.name || '').toLowerCase();
                    const isDone = statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('closed');
                    return dueDay.getTime() < today.getTime() && !isDone;
                }
                if (dateFilter === 'THIS_WEEK') {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    return dueDay >= startOfWeek && dueDay <= endOfWeek;
                }
                if (dateFilter === 'THIS_MONTH') {
                    return dueDay.getFullYear() === today.getFullYear() && dueDay.getMonth() === today.getMonth();
                }
                if (dateFilter === 'CUSTOM') {
                    if (customStartDate) {
                        const start = new Date(customStartDate);
                        start.setHours(0, 0, 0, 0);
                        if (dueDay < start) return false;
                    }
                    if (customEndDate) {
                        const end = new Date(customEndDate);
                        end.setHours(23, 59, 59, 999);
                        if (dueDay > end) return false;
                    }
                    return true;
                }
                return true;
            });
        }

        // 3. Search Query Filter across Title, Task ID, Description, Project Name, Status, Type, Assignees (Name/Email), Tags
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((task) => {
                if (task.title.toLowerCase().includes(q)) return true;
                if (task.taskId && task.taskId.toLowerCase().includes(q)) return true;
                if (task.description && task.description.toLowerCase().includes(q)) return true;
                if (task.projectName && task.projectName.toLowerCase().includes(q)) return true;
                if (task.status?.name && task.status.name.toLowerCase().includes(q)) return true;
                if (task.type && task.type.toLowerCase().includes(q)) return true;
                if (task.assignees.some((a) => a.name.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q)))) return true;
                if (task.tags.some((tag) => tag.name.toLowerCase().includes(q))) return true;
                return false;
            });
        }

        return result;
    }, [rawTasks, selectedStatusFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

    // Group tasks directly by Project Name
    const groupedProjects = useMemo(() => {
        const projectsMap = new Map<
            string,
            {
                projectId: string;
                projectName: string;
                projectColor?: string | null;
                tasks: MyTask[];
            }
        >();

        filteredTasks.forEach((task) => {
            const pId = task.projectId || 'UNCATEGORIZED';
            const pName = task.projectName || 'General Project';

            if (!projectsMap.has(pId)) {
                projectsMap.set(pId, {
                    projectId: pId,
                    projectName: pName,
                    projectColor: task.projectColor,
                    tasks: [],
                });
            }

            projectsMap.get(pId)!.tasks.push(task);
        });

        return Array.from(projectsMap.values());
    }, [filteredTasks]);

    // Default expand all projects
    useEffect(() => {
        const initialExpand: Record<string, boolean> = {};
        groupedProjects.forEach((p) => {
            initialExpand[p.projectId] = true;
        });
        setExpandedProjects(initialExpand);
    }, [groupedProjects.length]);

    const toggleProjectExpand = (projectId: string) => {
        setExpandedProjects((prev) => ({
            ...prev,
            [projectId]: !prev[projectId],
        }));
    };

    const userName = userMember?.user.name || 'User';
    const userEmail = userMember?.user.email || '';
    const userAvatar = userMember?.user.avatarUrl;
    const userRole = userMember?.role || 'Team Member';

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Top Bar Header */}
            <div className="border-b border-gray-100 py-3.5 px-6 flex-shrink-0 bg-white shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/team')}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 cursor-pointer"
                            title="Back to Team"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3">
                            <Avatar name={userName} src={userAvatar} size="md" className="rounded-lg shadow-xs" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">{userName}'s Tasks</h1>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        {userRole}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">{userEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls & Filters */}
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600">
                            <ListTodo className="w-4 h-4 text-blue-600" />
                            <span>Total: <strong className="text-gray-900">{filteredTasks.length}</strong></span>
                        </div>

                        {/* Comprehensive Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search task, project, owner, tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Dropdown with colored status dots */}
                        <StatusFilterDropdown
                            selectedStatusId={selectedStatusFilter}
                            statusOptions={statusOptions}
                            onChange={(stId) => setSelectedStatusFilter(stId)}
                        />

                        {/* Date Filter Dropdown */}
                        <DateFilterDropdown
                            dateFilter={dateFilter}
                            onChangeFilter={(val) => setDateFilter(val)}
                            customStartDate={customStartDate}
                            customEndDate={customEndDate}
                            onStartDateChange={setCustomStartDate}
                            onEndDateChange={setCustomEndDate}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50/50 p-4 lg:p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-3">
                        <Loader />
                        <p className="text-xs text-gray-500 font-medium">Loading user tasks...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                        <ListTodo className="w-12 h-12 text-gray-300 mb-3" />
                        <h3 className="text-sm font-bold text-gray-800">No tasks found</h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                            {searchQuery || selectedStatusFilter !== 'ALL' || dateFilter !== 'ALL'
                                ? 'No tasks match your search or filter criteria.'
                                : `${userName} currently has no assigned tasks.`}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Project-Based Task List Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-2.5 px-4 w-[340px]">TASK NAME</th>
                                        <th className="py-2.5 px-3 w-[100px]">TYPE</th>
                                        <th className="py-2.5 px-3 w-[140px]">STATUS</th>
                                        <th className="py-2.5 px-3 w-[120px]">OWNER</th>
                                        <th className="py-2.5 px-3 w-[140px]">TAGS</th>
                                        <th className="py-2.5 px-3 w-[110px]">START DATE</th>
                                        <th className="py-2.5 px-3 w-[110px]">DUE DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {groupedProjects.map((project) => {
                                        const isExpanded = expandedProjects[project.projectId] !== false;
                                        const initial = project.projectName?.charAt(0) || 'P';

                                        return (
                                            <React.Fragment key={project.projectId}>
                                                {/* Project Group Header Row */}
                                                <tr className="bg-slate-100/80 border-t border-b border-slate-200/90">
                                                    <td colSpan={7} className="py-2.5 px-4">
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="flex items-center gap-2.5 cursor-pointer group/proj"
                                                                onClick={() => toggleProjectExpand(project.projectId)}
                                                            >
                                                                <button className="p-1 hover:bg-slate-200/70 rounded text-slate-600 transition-colors cursor-pointer">
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="w-4 h-4 text-blue-600" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                                    )}
                                                                </button>

                                                                <div
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-white font-extrabold text-[10px] shadow-xs"
                                                                    style={{
                                                                        backgroundColor: project.projectColor || '#091590',
                                                                        background: project.projectColor
                                                                            ? `linear-gradient(135deg, ${project.projectColor}, ${project.projectColor}dd)`
                                                                            : '#091590',
                                                                    }}
                                                                >
                                                                    {initial}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs group-hover/proj:text-blue-600 transition-colors">
                                                                        {project.projectName}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300/50">
                                                                        {project.tasks.length} {project.tasks.length === 1 ? 'task' : 'tasks'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {project.projectId !== 'UNCATEGORIZED' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push(`/projects/${project.projectId}`);
                                                                    }}
                                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/60 hover:bg-blue-100/60 px-2 py-1 rounded border border-blue-200/50 cursor-pointer"
                                                                >
                                                                    <span>View Project</span>
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Project Tasks list */}
                                                {isExpanded &&
                                                    project.tasks.map((task) => (
                                                        <TaskRow
                                                            key={task.id}
                                                            task={task}
                                                            onOpenModal={() =>
                                                                setTaskModalState({
                                                                    isOpen: true,
                                                                    taskId: task.id,
                                                                    projectId: task.projectId,
                                                                })
                                                            }
                                                        />
                                                    ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Task View Modal */}
            {taskModalState.isOpen && taskModalState.projectId && taskModalState.taskId && (
                <TaskModalWrapper
                    isOpen={taskModalState.isOpen}
                    onClose={() => setTaskModalState({ isOpen: false, taskId: null, projectId: null })}
                    projectId={taskModalState.projectId}
                    taskId={taskModalState.taskId}
                    onTaskUpdated={() => refetch()}
                />
            )}
        </div>
    );
}

function TaskRow({
    task,
    onOpenModal,
}: {
    task: MyTask;
    onOpenModal: () => void;
}) {
    const typeKey = task.type || 'FEAT';
    const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG['FEAT'];
    const TypeIcon = typeConfig.icon;

    const startDateFormatted = task.startDate ? new Date(task.startDate).toLocaleDateString('en-US') : '-';

    let dueDateFormatted = '-';
    let isPast = false;
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        dueDateFormatted = d.toLocaleDateString('en-US');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        isPast = d.getTime() < today.getTime();
    }

    const fullTooltip = `${task.title}${task.projectName ? ` - ${task.projectName}` : ''}${task.status?.name ? ` - ${task.status.name}` : ''}`;

    return (
        <tr
            onClick={onOpenModal}
            title={fullTooltip}
            className="hover:bg-blue-50/40 transition-colors cursor-pointer group border-b border-gray-100"
        >
            {/* Task Name & Formatted Code */}
            <td className="py-3 px-4 pl-8" title={fullTooltip}>
                <div className="flex items-center gap-2.5" title={fullTooltip}>
                    <span className="text-[11px] font-bold text-gray-400 font-mono shrink-0">
                        {task.taskId || '0000'}
                    </span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate" title={fullTooltip}>
                        {task.title}
                    </span>
                </div>
            </td>

            {/* Type Badge */}
            <td className="py-3 px-3">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight shadow-2xs",
                        typeConfig.color,
                        typeConfig.bg
                    )}
                >
                    <TypeIcon className="w-2.5 h-2.5" />
                    {typeConfig.label}
                </span>
            </td>

            {/* Read-only Status Badge */}
            <td className="py-3 px-3">
                {task.status ? (
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wide shadow-2xs truncate"
                        style={{
                            backgroundColor: `${task.status.color || '#64748b'}15`,
                            color: task.status.color || '#64748b',
                            borderColor: `${task.status.color || '#64748b'}40`,
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: task.status.color || '#64748b' }}
                        />
                        {task.status.name}
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-400 italic">-</span>
                )}
            </td>

            {/* Owner / Assignees */}
            <td className="py-3 px-3">
                <div className="flex items-center gap-1.5">
                    {task.assignees.length > 0 ? (
                        task.assignees.slice(0, 2).map((a) => (
                            <div key={a.id} className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                <Avatar name={a.name} src={a.avatarUrl} size="xs" />
                                <span className="text-[10px] font-medium text-gray-700 truncate max-w-[80px]">{a.name}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                    )}
                </div>
            </td>

            {/* Tags */}
            <td className="py-3 px-3">
                <div className="flex items-center gap-1 flex-wrap">
                    {task.tags.length > 0 ? (
                        task.tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[9px] font-semibold border"
                                style={{
                                    backgroundColor: `${tag.color}15`,
                                    color: tag.color,
                                    borderColor: `${tag.color}30`,
                                }}
                            >
                                {tag.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-400 italic">-</span>
                    )}
                </div>
            </td>

            {/* Start Date */}
            <td className="py-3 px-3 text-[11px] font-medium text-gray-500">
                {startDateFormatted}
            </td>

            {/* Due Date */}
            <td className="py-3 px-3 text-[11px] font-medium">
                <span className={isPast ? 'text-red-600 font-bold' : 'text-gray-600'}>
                    {dueDateFormatted}
                </span>
            </td>
        </tr>
    );
}
