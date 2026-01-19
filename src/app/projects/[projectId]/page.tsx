'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
    ArrowLeft,
    Calendar,
    Plus,
    Search,
    LayoutGrid,
    List as ListIcon,
    Tag as TagIcon,
    MoreVertical,
    Flag,
    User,
    CheckSquare,
    ChevronRight,
    ChevronDown,
    X,
    ShieldAlert,
    FolderX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
// import { projectsApi } from '@/services/projects.service'; // Removed
// import { taskService, workflowService } from '@/services/tasks.service'; // Removed
import { useProject } from '@/hooks/use-projects';
import {
    useProjectTasks,
    useProjectWorkflow,
    useCreateTask,
    useUpdateTaskStatus
} from '@/hooks/use-tasks';
import type { Project, Tag } from '@/types/project';
import type { Task, WorkflowStage, CreateTaskPayload, TaskPriority } from '@/types/task';

import { Tabs, TabItem } from '@/components/ui/Tabs';

type ViewMode = 'board' | 'list';

const TAB_ITEMS: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'reports', label: 'Reports' },
    { id: 'documents', label: 'Documents' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'phases', label: 'Phases' },
    { id: 'time-logs', label: 'Time Logs' },
    { id: 'issues', label: 'Issues' },
    { id: 'timesheet', label: 'Timesheet' },
];

const PRIORITY_COLORS = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-600',
    3: 'bg-yellow-100 text-yellow-600',
    4: 'bg-orange-100 text-orange-600',
    5: 'bg-red-100 text-red-600',
};

const PRIORITY_LABELS = {
    1: 'Lowest',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical',
};

const STATUS_COLORS: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
    const { data: workflow = [], isLoading: workflowLoading } = useProjectWorkflow(projectId);
    const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(projectId);

    // Mutations
    const createTaskMutation = useCreateTask(projectId);
    const updateTaskStatusMutation = useUpdateTaskStatus(projectId);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeTab, setActiveTab] = useState('tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // For mutation errors
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleTaskExpansion = (taskId: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedIds(newExpanded);
    };

    const isLoading = projectLoading || workflowLoading || tasksLoading;

    // Clear mutation error on successful fetch or when other things change (optional)
    useEffect(() => {
        if (projectError) setErrorMessage((projectError as Error).message);
    }, [projectError]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [tasks, searchQuery]);

    const parentTasks = useMemo(() => {
        return filteredTasks.filter(t => !t.parentId);
    }, [filteredTasks]);

    const getSubtasks = (parentId: string) => {
        return tasks.filter(t => t.parentId === parentId);
    };

    const handleCreateTask = async (taskData: CreateTaskPayload) => {
        try {
            await createTaskMutation.mutateAsync(taskData);

            // Auto-expand parent if creating subtask
            if (taskData.parentId) {
                setExpandedIds(prev => new Set(prev).add(taskData.parentId!));
            }

            setIsCreateTaskOpen(false);
            setSelectedParentTask(null);
        } catch (error: any) {
            console.error('Failed to create task:', error);
            // setErrorMessage(error.message); // If you want to show error in main view, or handle in modal
            throw error;
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, statusId: string) => {
        try {
            await updateTaskStatusMutation.mutateAsync({ taskId, data: { statusId } });
        } catch (error) {
            console.error('Failed to update task status:', error);
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        );
    }

    if (errorMessage || !project) {
        // Try to derive status from error message or projectError object
        const isForbidden = errorMessage?.includes('403') ||
            errorMessage?.toLowerCase().includes('access denied') ||
            (projectError as any)?.response?.status === 403;

        const isNotFound = errorMessage?.includes('404') ||
            errorMessage?.toLowerCase().includes('not found') ||
            (projectError as any)?.response?.status === 404;

        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-md w-full mx-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-6",
                        isForbidden ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-500"
                    )}>
                        {isForbidden ? (
                            <ShieldAlert className="w-8 h-8" />
                        ) : (
                            <FolderX className="w-8 h-8" />
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {isForbidden ? "Access Restricted" : "Project Not Found"}
                    </h2>

                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        {isForbidden
                            ? "You don't have permission to view this project. It might be private or you may need to be invited."
                            : "The project you're looking for doesn't exist or has been deleted. Please check the URL or go back to your dashboard."
                        }
                    </p>

                    <div className="space-y-3 w-full">
                        <button
                            onClick={() => router.push('/projects')}
                            className="w-full px-4 py-2.5 bg-[#091590] text-white rounded-lg hover:bg-[#071170] font-medium transition-colors shadow-sm text-sm"
                        >
                            Return to Projects
                        </button>

                        <div className="pt-2 border-t border-gray-50">
                            <p className="text-[10px] text-gray-400 font-mono">
                                Error: {errorMessage || 'Unknown error'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Compact Combined Header */}
            {/* Compact Combined Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-1.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                style={{ backgroundColor: project.color || '#3B82F6' }}
                            >
                                {project.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-bold text-gray-900 leading-none">{project.name}</h1>
                                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                        {project.projectId}
                                    </span>
                                    <span
                                        className={cn(
                                            'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
                                            STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'
                                        )}
                                    >
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Actions Row */}
            <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
                <Tabs
                    items={TAB_ITEMS}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="border-none"
                />

                {/* Toolbar (Only visible when Tasks tab is active) */}
                {activeTab === 'tasks' && (
                    <div className="flex items-center gap-3 py-1">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 bg-gray-50 transition-all hover:bg-white focus:bg-white"
                            />
                        </div>

                        <div className="h-5 w-px bg-gray-200 mx-1"></div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-50 p-0.5 rounded-md border border-gray-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-1 rounded transition-all',
                                    viewMode === 'list'
                                        ? 'bg-white text-[var(--primary)] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                                )}
                                title="List View"
                            >
                                <ListIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={cn(
                                    'p-1 rounded transition-all',
                                    viewMode === 'board'
                                        ? 'bg-white text-[var(--primary)] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                                )}
                                title="Kanban View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* New Task Button */}
                        {project?.role !== 'VIEWER' && (
                            <button
                                onClick={() => setIsCreateTaskOpen(true)}
                                className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white cursor-pointer active:scale-[0.98] font-medium px-3 h-7 text-xs rounded-md ml-2 transition-colors duration-200 border border-transparent shadow-sm"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                New Task
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-white">
                {activeTab === 'tasks' ? (
                    <div className="h-full">
                        {viewMode === 'list' ? (
                            <TaskTable
                                tasks={parentTasks}
                                allTasks={tasks}
                                workflow={workflow}
                                onUpdateStatus={handleUpdateTaskStatus}
                                expandedIds={expandedIds}
                                onToggleExpand={toggleTaskExpansion}
                                onCreateSubtask={project?.role !== 'VIEWER' ? (parentTask) => {
                                    setSelectedParentTask(parentTask);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                            />
                        ) : (
                            <KanbanView
                                tasks={parentTasks}
                                allTasks={tasks}
                                workflow={workflow}
                                onUpdateStatus={handleUpdateTaskStatus}
                                onCreateSubtask={project?.role !== 'VIEWER' ? (parentTask) => {
                                    setSelectedParentTask(parentTask);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <LayoutGrid className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{TAB_ITEMS.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-sm">This module is coming soon.</p>
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {
                isCreateTaskOpen && (
                    <CreateTaskModal
                        isOpen={isCreateTaskOpen}
                        onClose={() => {
                            setIsCreateTaskOpen(false);
                            setSelectedParentTask(null);
                        }}
                        onSubmit={handleCreateTask}
                        workflow={workflow}
                        parentTask={selectedParentTask}
                    />
                )
            }
        </div >
    );
}
// Task Table Component
interface TaskTableProps {
    tasks: Task[];
    allTasks: Task[];
    workflow: WorkflowStage[];
    onUpdateStatus: (taskId: string, statusId: string) => void;
    onCreateSubtask?: (parentTask: Task) => void;
    expandedIds: Set<string>;
    onToggleExpand: (taskId: string) => void;
}

function TaskTable({ tasks, allTasks, workflow, onUpdateStatus, onCreateSubtask, expandedIds, onToggleExpand }: TaskTableProps) {

    const gridDisplayData = useMemo(() => {
        const displayRows: any[] = [];

        const getSubtasksDisplay = (parentId: string) => allTasks.filter(t => t.parentId === parentId);
        const hasSubtasks = (taskId: string) => allTasks.some(t => t.parentId === taskId);

        // Recursive function to add tasks to displayRows
        const addTasksRecursive = (tasksToAdd: Task[], level: number) => {
            tasksToAdd.forEach(task => {
                const hasChildren = hasSubtasks(task.id);
                const isExpanded = expandedIds.has(task.id);

                displayRows.push({
                    ...task,
                    isWrapper: false,
                    level,
                    hasChildren,
                    isExpanded
                });

                if (hasChildren && isExpanded) {
                    const subtasks = getSubtasksDisplay(task.id);
                    addTasksRecursive(subtasks, level + 1);
                }
            });
        };

        addTasksRecursive(tasks, 0); // Start with top-level tasks
        return displayRows;
    }, [tasks, allTasks, expandedIds]);

    // Toggle logic is now lifted up

    const TaskNameRenderer = (props: ICellRendererParams) => {
        const { onToggleExpand, onCreateSubtask, allTasks } = props.context;
        const task = props.data;
        // Don't fetch subtasks here for layout, used pre-calculated hierarchy props
        const level = task.level || 0;
        const hasChildren = task.hasChildren;
        const isExpanded = task.isExpanded;

        // For the subtask count badge
        const subtasks = allTasks.filter((t: Task) => t.parentId === task.id);
        const completedSubtasks = subtasks.filter((st: Task) =>
            st.status.name.toLowerCase().includes('done') ||
            st.status.name.toLowerCase().includes('complete')
        ).length;

        return (
            <div className="flex items-center h-full" style={{ paddingLeft: `${level * 24}px` }}>
                {/* Toggle Button or Spacer */}
                <div className="w-6 flex-shrink-0 flex items-center justify-center mr-1">
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(task.id);
                            }}
                            className="p-0.5 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-medium text-sm truncate",
                            level > 0 ? "text-gray-700" : "text-gray-900"
                        )}>
                            {task.title}
                        </span>
                        {hasChildren && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-500 font-medium">
                                <CheckSquare className="w-3 h-3" />
                                {completedSubtasks}/{subtasks.length}
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5 pl-0">{task.description}</div>
                    )}
                </div>

                {/* Quick Add Subtask (any level) */}
                {onCreateSubtask && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateSubtask(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 text-gray-400 hover:text-[var(--primary)] rounded transition-all ml-2"
                        title="Add subtask"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    const StatusRenderer = (props: ICellRendererParams) => {
        const task: Task = props.data;
        const allStatuses = workflow.flatMap(stage =>
            stage.statuses.map(status => ({ ...status, stageName: stage.name }))
        );

        return (
            <select
                value={task.status.id}
                onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                className="text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{
                    backgroundColor: task.status.id + '20',
                    color: task.status.id,
                }}
            >
                {allStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                        {status.stageName} - {status.name}
                    </option>
                ))}
            </select>
        );
    };

    const PriorityRenderer = (props: ICellRendererParams) => {
        const priority: TaskPriority = props.value;
        return (
            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        PRIORITY_COLORS[priority]
                    )}
                >
                    <Flag className="w-3 h-3" />
                    {PRIORITY_LABELS[priority]}
                </span>
            </div>
        );
    };

    const DueDateRenderer = (props: ICellRendererParams) => {
        const date = props.value;
        if (!date) return <span className="text-gray-300 text-xs">-</span>;

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        const isPast = new Date(date) < new Date();

        return (
            <span className={cn('text-xs', isPast ? 'text-red-600 font-medium' : 'text-gray-600')}>
                {formattedDate}
            </span>
        );
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            {
                headerName: 'S.No',
                valueGetter: "node.rowIndex + 1",
                width: 65,
                pinned: 'left',
                cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
                suppressMenu: true,
            },
            // Task Table: Make Status flexible
            {
                field: 'title',
                headerName: 'TASK',
                minWidth: 300,
                cellRenderer: TaskNameRenderer,
                cellClass: 'group',
                flex: 1.5,
            },
            {
                field: 'status',
                headerName: 'STATUS',
                width: 200,
                flex: 0.5, // Allow status to grow slightly
                cellRenderer: StatusRenderer,
            },
            {
                field: 'priority',
                headerName: 'PRIORITY',
                width: 150,
                cellRenderer: PriorityRenderer,
            },
            {
                field: 'dueDate',
                headerName: 'DUE DATE',
                width: 120,
                cellRenderer: DueDateRenderer,
            },
            {
                field: 'assigneeIds',
                headerName: 'ASSIGNEES',
                width: 120,
                cellRenderer: (props: ICellRendererParams) => {
                    const count = props.value?.length || 0;
                    if (count === 0) return <span className="text-gray-300 text-xs">-</span>;
                    return (
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{count}</span>
                        </div>
                    );
                },
            },
        ],
        [workflow] // context handles updates for callbacks
    );

    return (
        <div className="h-full w-full ag-theme-alpine custom-ag-grid">
            <style jsx global>{`
                .custom-ag-grid .ag-root-wrapper {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    background-color: white;
                    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                }
                .custom-ag-grid .ag-header {
                    background-color: #f1f5f9 !important;
                    border-bottom: 1px solid #cbd5e1 !important;
                    min-height: 48px !important;
                }
                .custom-ag-grid .ag-header-row {
                    height: 48px !important;
                }
                .custom-ag-grid .ag-header-cell {
                    padding-left: 16px;
                    padding-right: 16px;
                }
                .custom-ag-grid .ag-header-cell-label {
                    font-weight: 700;
                    color: #334155 !important;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .custom-ag-grid .ag-row {
                    border-bottom: 1px solid #f1f5f9;
                    background-color: #ffffff;
                }
                .custom-ag-grid .ag-cell {
                    padding-left: 16px;
                    padding-right: 16px;
                    display: flex;
                    align-items: center;
                    color: #0f172a;
                    font-size: 13px;
                    font-weight: 500;
                }
                .custom-ag-grid .ag-row:hover {
                    background-color: #f8fafc !important;
                }
                .custom-ag-grid .ag-row-selected {
                    background-color: #eff6ff !important;
                }
            `}</style>
            <AgGridReact
                rowData={gridDisplayData}
                columnDefs={columnDefs}
                defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
                }}
                rowHeight={60}
                headerHeight={40}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
                theme="legacy"
                context={{
                    onToggleExpand,
                    onCreateSubtask,
                    allTasks
                }}
            />
        </div>
    );
}

// Kanban View Component
interface KanbanViewProps {
    tasks: Task[];
    allTasks: Task[];
    workflow: WorkflowStage[];
    onUpdateStatus: (taskId: string, statusId: string) => void;
    onCreateSubtask?: (parentTask: Task) => void;
}

function KanbanView({ tasks, allTasks, workflow, onUpdateStatus, onCreateSubtask }: KanbanViewProps) {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const getTasksByStage = (stageId: string) => {
        const stage = workflow.find(s => s.id === stageId);
        if (!stage) return [];

        return tasks.filter(task =>
            stage.statuses.some(status => status.id === task.status.id)
        );
    };

    const getSubtasks = (parentId: string) => {
        return allTasks.filter(t => t.parentId === parentId);
    };

    const handleDrop = (stageId: string) => {
        if (!draggedTask) return;

        const stage = workflow.find(s => s.id === stageId);
        const defaultStatus = stage?.statuses.find(s => s.isDefault) || stage?.statuses[0];

        if (defaultStatus && draggedTask.status.id !== defaultStatus.id) {
            onUpdateStatus(draggedTask.id, defaultStatus.id);
        }

        setDraggedTask(null);
    };

    return (
        <div className="h-full overflow-x-auto p-6 bg-gray-50">
            <div className="flex gap-4 h-full w-full">
                {workflow.map((stage) => {
                    const stageTasks = getTasksByStage(stage.id);

                    return (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 flex-1 min-w-[320px] bg-white rounded-lg border border-gray-200 flex flex-col"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {stageTasks.length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Cards */}
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                {stageTasks.map((task) => {
                                    const subtasks = getSubtasks(task.id);
                                    const completedSubtasks = subtasks.filter(st =>
                                        st.status.name.toLowerCase().includes('done') ||
                                        st.status.name.toLowerCase().includes('complete')
                                    );

                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={() => setDraggedTask(task)}
                                            className="bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-sm font-medium text-gray-900 flex-1">
                                                    {task.title}
                                                </h4>
                                                {onCreateSubtask && (
                                                    <button
                                                        onClick={() => onCreateSubtask(task)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-blue-600"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {task.description && (
                                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                                        PRIORITY_COLORS[task.priority]
                                                    )}
                                                >
                                                    <Flag className="w-3 h-3" />
                                                    {PRIORITY_LABELS[task.priority]}
                                                </span>

                                                {task.dueDate && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                )}

                                                {task.assigneeIds?.length > 0 && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {task.assigneeIds.length}
                                                    </span>
                                                )}
                                            </div>

                                            {subtasks.length > 0 && (
                                                <div className="pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between text-xs mb-2">
                                                        <span className="text-gray-600 font-medium">Subtasks</span>
                                                        <span className="text-gray-500">
                                                            {completedSubtasks.length}/{subtasks.length}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div
                                                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                            style={{
                                                                width: `${(completedSubtasks.length / subtasks.length) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        {subtasks.slice(0, 3).map((subtask) => (
                                                            <div
                                                                key={subtask.id}
                                                                className="text-xs text-gray-600 flex items-start gap-1.5"
                                                            >
                                                                <span className="text-gray-400 mt-0.5">•</span>
                                                                <span className="flex-1 line-clamp-1">{subtask.title}</span>
                                                            </div>
                                                        ))}
                                                        {subtasks.length > 3 && (
                                                            <div className="text-xs text-gray-400 pl-3">
                                                                +{subtasks.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {stageTasks.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Create Task Modal
interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskPayload) => Promise<void>;
    workflow: WorkflowStage[];
    parentTask?: Task | null;
}

function CreateTaskModal({ isOpen, onClose, onSubmit, workflow, parentTask }: CreateTaskModalProps) {
    const [formData, setFormData] = useState<CreateTaskPayload>({
        title: '',
        description: '',
        priority: 3,
        statusId: workflow[0]?.statuses.find(s => s.isDefault)?.id || workflow[0]?.statuses[0]?.id || '',
        dueDate: '',
        assigneeIds: [],
        parentId: parentTask?.id || null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allStatuses = workflow.flatMap(stage =>
        stage.statuses.map(status => ({ ...status, stageName: stage.name }))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(formData);
        } catch (err) {
            setError('Failed to create task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
            // onClick={onClose}
            />
            <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out translate-x-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {parentTask ? `Add Subtask to "${parentTask.title}"` : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Enter task title"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                placeholder="Enter task description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.statusId}
                                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {allStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.stageName} - {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) as TaskPriority })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value={1}>Lowest</option>
                                    <option value={2}>Low</option>
                                    <option value={3}>Medium</option>
                                    <option value={4}>High</option>
                                    <option value={5}>Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}
                    </form>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.title.trim()}
                        className="px-6 py-2 cursor-pointer text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[100px]"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            parentTask ? 'Add Subtask' : 'Create Task'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
