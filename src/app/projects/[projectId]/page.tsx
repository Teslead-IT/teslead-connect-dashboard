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
    Pencil,
    Trash2,
} from 'lucide-react';
import { cn, getAvatarColor } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
// import { projectsApi } from '@/services/projects.service'; // Removed
// import { taskService, workflowService } from '@/services/tasks.service'; // Removed
import { useProject, useProjectMembers } from '@/hooks/use-projects';
import {
    useProjectTasks,
    useProjectWorkflow,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useRevokeAssignee,
} from '@/hooks/use-tasks';
import { ProjectMembersTable } from '@/components/projects/ProjectMembersTable';
import { CreateTaskModal } from '@/components/ui/CreateTaskModal';
import { TaskContextMenu } from '@/components/tasks/TaskContextMenu';
import { AssignUsersToTaskModal } from '@/components/tasks/AssignUsersToTaskModal';
import { RevokeAssigneeModal } from '@/components/tasks/RevokeAssigneeModal';
import type { Task, WorkflowStage, CreateTaskPayload, TaskPriority } from '@/types/task';
import { Dialog } from '@/components/ui/Dialog';
import { useToast, ToastContainer } from '@/components/ui/Toast';

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
    const { data: members = [], isLoading: membersLoading } = useProjectMembers(projectId);
    const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(projectId);

    // Mutations
    const createTaskMutation = useCreateTask(projectId);
    // const updateTaskStatusMutation = useUpdateTaskStatus(projectId); // Removed

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeTab, setActiveTab] = useState('tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // For mutation errors
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [taskContextMenu, setTaskContextMenu] = useState<{
        task: Task;
        x: number;
        y: number;
    } | null>(null);

    // Delete Dialog State
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; task: Task | null; isDeleting: boolean }>({
        isOpen: false,
        task: null,
        isDeleting: false
    });

    const [assignUsersModal, setAssignUsersModal] = useState<{
        isOpen: boolean;
        task: Task | null;
    }>({ isOpen: false, task: null });

    const [revokeAssigneeModal, setRevokeAssigneeModal] = useState<{
        isOpen: boolean;
        taskId: string | null;
    }>({ isOpen: false, taskId: null });

    const [directRevoke, setDirectRevoke] = useState<{
        task: Task;
        assignee: any;
    } | null>(null);

    const updateTaskMutation = useUpdateTask(projectId);
    const revokeAssigneeMutation = useRevokeAssignee(projectId);
    const deleteTaskMutation = useDeleteTask(projectId);
    const toast = useToast();

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

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setTaskContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleTaskContextMenu = (event: React.MouseEvent | any, task: Task) => {
        // Handle both native MouseEvent and AG Grid params
        const e = event.event || event;
        e.preventDefault();

        // Adjust coordinates if needed (AG Grid event might need clientX/Y from the native event)
        const x = e.clientX;
        const y = e.clientY;

        setTaskContextMenu({
            task,
            x,
            y
        });
    };

    const handleTaskSubmit = async (taskData: CreateTaskPayload) => {
        try {
            if (editingTask) {
                await updateTaskMutation.mutateAsync({
                    taskId: editingTask.id,
                    data: taskData
                });
            } else {
                await createTaskMutation.mutateAsync(taskData);
                // Auto-expand parent if creating subtask
                if (taskData.parentId) {
                    setExpandedIds(prev => new Set(prev).add(taskData.parentId!));
                }
            }

            setIsCreateTaskOpen(false);
            setSelectedParentTask(null);
            setEditingTask(null);
            setIsReadOnly(false);
        } catch (error: any) {
            console.error('Failed to save task:', error);
            throw error;
        }
    };

    const handleDeleteTask = (taskId: string) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (taskToDelete) {
            setDeleteDialog({ isOpen: true, task: taskToDelete, isDeleting: false });
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.task) return;

        setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteTaskMutation.mutateAsync(deleteDialog.task.id);
            toast.success('Task deleted successfully');
            setDeleteDialog({ isOpen: false, task: null, isDeleting: false });
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task', 'An error occurred while deleting the task. Please try again.');
            setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleConfirmDirectRevoke = async () => {
        if (!directRevoke) return;
        const { task, assignee } = directRevoke;
        const userId = assignee.user?.id || assignee.userId || assignee.id;

        const toastId = toast.loading('Revoking assignment...');
        try {
            await revokeAssigneeMutation.mutateAsync({ taskId: task.id, userId });
            toast.success('Assignment revoked successfully', undefined, { id: toastId });
            setDirectRevoke(null);
        } catch (error) {
            console.error('Failed to revoke assignment:', error);
            toast.error('Failed to revoke assignment', undefined, { id: toastId });
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, statusId: string) => {
        const toastId = toast.loading('Updating status...');
        try {
            await updateTaskMutation.mutateAsync({
                taskId,
                data: { statusId }
            });
            toast.success('Status updated successfully', undefined, { id: toastId });
        } catch (error) {
            console.error('Failed to update task status:', error);
            toast.error('Failed to update status', undefined, { id: toastId });
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
            {/* Compact Combined Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                                style={{ backgroundColor: project.color || '#3B82F6' }}
                            >
                                {project.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <h1 className="text-base font-bold text-gray-900 leading-none truncate max-w-[150px] sm:max-w-[300px] md:max-w-[400px]" title={project.name}>{project.name}</h1>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 py-0.5 rounded border border-gray-100 flex-shrink-0">
                                            {project.projectId}
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex-shrink-0',
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
            </div>

            {/* Tabs & Actions Row */}
            <div className="bg-white border-b border-gray-200 px-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2">
                <Tabs
                    items={TAB_ITEMS}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="border-none w-full sm:w-auto -ml-2 sm:ml-0 overflow-x-auto no-scrollbar"
                />

                {/* Toolbar (Only visible when Tasks tab is active) */}
                {activeTab === 'tasks' && (
                    <div className="flex items-center justify-between sm:justify-end gap-3 py-1 w-full sm:w-auto mt-1 sm:mt-0">
                        {/* Search */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-48 bg-gray-50 transition-all hover:bg-white focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

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
                                    onClick={() => {
                                        setIsReadOnly(false);
                                        setIsCreateTaskOpen(true);
                                    }}
                                    className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white cursor-pointer active:scale-[0.98] font-medium px-3 h-7 text-xs rounded-md sm:ml-2 transition-colors duration-200 border border-transparent shadow-sm whitespace-nowrap"
                                >
                                    <Plus className="w-3 h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">New Task</span>
                                    <span className="sm:hidden">New</span>
                                </button>
                            )}
                        </div>
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
                                isEditable={project?.role !== 'VIEWER'}
                                onCreateSubtask={project?.role !== 'VIEWER' ? (parentTask) => {
                                    setSelectedParentTask(parentTask);
                                    setIsReadOnly(false);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                                onEditTask={project?.role !== 'VIEWER' ? (task) => {
                                    setEditingTask(task);
                                    setIsReadOnly(false);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                                onDeleteTask={project?.role !== 'VIEWER' ? handleDeleteTask : undefined}
                                onContextMenu={handleTaskContextMenu}
                                onSwitchToUsersTab={() => setActiveTab('users')}
                                onRevokeAssigneeDirect={project?.role !== 'VIEWER' ? (task, assignee) => setDirectRevoke({ task, assignee }) : undefined}
                            />
                        ) : (
                            <KanbanView
                                tasks={parentTasks}
                                allTasks={tasks}
                                workflow={workflow}
                                onUpdateStatus={handleUpdateTaskStatus}
                                isEditable={project?.role !== 'VIEWER'}
                                onCreateSubtask={project?.role !== 'VIEWER' ? (parentTask) => {
                                    setSelectedParentTask(parentTask);
                                    setIsReadOnly(false);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                                onEditTask={project?.role !== 'VIEWER' ? (task) => {
                                    setEditingTask(task);
                                    setIsReadOnly(false);
                                    setIsCreateTaskOpen(true);
                                } : undefined}
                                onDeleteTask={project?.role !== 'VIEWER' ? handleDeleteTask : undefined}
                            />
                        )}
                    </div>
                ) : activeTab === 'users' ? (
                    <ProjectMembersTable members={members} isLoading={membersLoading} projectId={projectId} currentUserRole={project?.role} />
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
                            setEditingTask(null);
                            setIsReadOnly(false);
                        }}
                        onSubmit={handleTaskSubmit}
                        workflow={workflow}
                        parentTask={selectedParentTask}
                        initialData={editingTask || undefined}
                        isReadOnly={isReadOnly}
                    />
                )
            }
            {/* Task Context Menu */}
            {taskContextMenu && (
                <TaskContextMenu
                    x={taskContextMenu.x}
                    y={taskContextMenu.y}
                    onClose={() => setTaskContextMenu(null)}
                    onEdit={project?.role !== 'VIEWER' ? () => {
                        setEditingTask(taskContextMenu.task);
                        setIsReadOnly(false);
                        setIsCreateTaskOpen(true);
                        setTaskContextMenu(null);
                    } : undefined}
                    onDelete={project?.role !== 'VIEWER' ? () => {
                        handleDeleteTask(taskContextMenu.task.id);
                        setTaskContextMenu(null);
                    } : undefined}
                    onCreateSubtask={project?.role !== 'VIEWER' ? () => {
                        setSelectedParentTask(taskContextMenu.task);
                        setIsReadOnly(false);
                        setIsCreateTaskOpen(true);
                        setTaskContextMenu(null);
                    } : undefined}
                    onViewDetails={() => {
                        setEditingTask(taskContextMenu.task);
                        setIsReadOnly(true);
                        setIsCreateTaskOpen(true);
                        setTaskContextMenu(null);
                    }}
                    onAssignUsers={project?.role !== 'VIEWER' ? () => {
                        setAssignUsersModal({ isOpen: true, task: taskContextMenu.task });
                        setTaskContextMenu(null);
                    } : undefined}
                    onRevokeAssignee={project?.role !== 'VIEWER' ? () => {
                        setRevokeAssigneeModal({ isOpen: true, taskId: taskContextMenu.task.id });
                        setTaskContextMenu(null);
                    } : undefined}
                />
            )}

            <ToastContainer />

            <Dialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, task: null, isDeleting: false })}
                type="warning"
                title="Delete Task"
                message={`Are you sure you want to delete "${deleteDialog.task?.title}"?`}
                description="This action cannot be undone. If this task has any subtasks, they will also be permanently deleted."
                confirmText="Delete Task"
                confirmVariant="destructive"
                onConfirm={handleConfirmDelete}
                isLoading={deleteDialog.isDeleting}
            />

            {/* Assign Users Modal */}
            {assignUsersModal.isOpen && assignUsersModal.task && (
                <AssignUsersToTaskModal
                    isOpen={assignUsersModal.isOpen}
                    onClose={() => setAssignUsersModal({ isOpen: false, task: null })}
                    task={assignUsersModal.task}
                    projectId={projectId}
                />
            )}

            {/* Revoke Assignee Modal */}
            {revokeAssigneeModal.isOpen && revokeAssigneeModal.taskId && (
                <RevokeAssigneeModal
                    isOpen={revokeAssigneeModal.isOpen}
                    onClose={() => setRevokeAssigneeModal({ isOpen: false, taskId: null })}
                    taskId={revokeAssigneeModal.taskId}
                    projectId={projectId}
                />
            )}

            <Dialog
                isOpen={!!directRevoke}
                onClose={() => setDirectRevoke(null)}
                type="warning"
                title="Revoke Assignment"
                message={`Are you sure you want to remove ${directRevoke?.assignee?.user?.name || directRevoke?.assignee?.name || 'this user'} from the task "${directRevoke?.task?.title}"?`}
                description="They will no longer be responsible for its completion."
                confirmText="Revoke Now"
                cancelText="Keep Assignment"
                confirmVariant="destructive"
                onConfirm={handleConfirmDirectRevoke}
                isLoading={revokeAssigneeMutation.isPending}
            />
        </div >
    );
}
// ==================== RENDERERS ====================

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
        <div className="flex items-center h-full w-full overflow-hidden" style={{ paddingLeft: `${level * 24}px` }}>
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
                    <span
                        className={cn(
                            "font-medium text-sm truncate min-w-0 block",
                            level > 0 ? "text-gray-700" : "text-gray-900"
                        )}
                        title={task.title}
                    >
                        {task.title}
                    </span>
                    {hasChildren && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-500 font-medium flex-shrink-0">
                            <CheckSquare className="w-3 h-3" />
                            {completedSubtasks}/{subtasks.length}
                        </span>
                    )}
                </div>
                {task.description && (
                    <div className="text-xs text-gray-500 truncate mt-0.5 pl-0 max-w-full block" title={task.description}>{task.description}</div>
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
    const { isEditable, workflow, onUpdateStatus } = props.context;

    // Flatten workflow statuses for the select options
    const allStatuses = useMemo(() => {
        return workflow.flatMap((stage: any) =>
            stage.statuses.map((status: any) => ({ ...status, stageName: stage.name }))
        );
    }, [workflow]);

    const currentStatus = allStatuses.find((s: any) => s.id === task.status.id);
    const statusName = currentStatus?.name || task.status.name || 'Unknown';
    const statusColor = currentStatus?.color || '#64748b'; // Default to slate-500 if no color

    // Generate styles dynamically based on backend color
    // Assuming backend returns HEX colors, we append alpha for transparency
    const statusStyle = {
        backgroundColor: `${statusColor}20`, // ~12% opacity
        color: statusColor,
        borderColor: `${statusColor}40`, // ~25% opacity
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatusId = e.target.value;
        if (newStatusId !== task.status.id) {
            onUpdateStatus(task.id, newStatusId);
        }
    };

    if (!isEditable) {
        return (
            <div className="status-select-wrapper">
                <span
                    className="status-select-base inline-flex items-center justify-center cursor-default hover:opacity-100"
                    style={statusStyle}
                >
                    {statusName}
                </span>
            </div>
        );
    }

    return (
        <div className="status-select-wrapper" onClick={(e) => e.stopPropagation()}>
            <select
                value={task.status.id}
                onChange={handleStatusChange}
                className="status-select-base"
                style={{
                    ...statusStyle,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                }}
            >
                {allStatuses.map((status: any) => (
                    <option key={status.id} value={status.id}>
                        {status.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="status-select-icon" style={{ color: statusColor }} />
        </div>
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
        year: 'numeric',
    });

    const isPast = new Date(date) < new Date();

    return (
        <span className={cn('text-xs', isPast ? 'text-red-600 font-medium' : 'text-gray-600')}>
            {formattedDate}
        </span>
    );
};

const AssigneeRenderer = (props: ICellRendererParams) => {
    const assignees = props.data.assignees || [];
    const count = assignees.length;

    if (count === 0) return <span className="text-gray-300 text-xs">-</span>;

    const displayedAssignees = assignees.slice(0, 3);
    const hiddenCount = count - 3;
    const { onSwitchToUsersTab, onRevokeAssigneeDirect, isEditable } = props.context;

    console.log("assignees,", assignees);

    return (
        <div className="flex items-center -space-x-2 overflow-hidden h-full py-1">
            {displayedAssignees.map((assignee: any, index: number) => (
                <div
                    key={assignee.assignmentId || assignee.user?.id || `assignee-${index}`}
                    className={cn(
                        "relative group transition-transform hover:z-10 hover:scale-105",
                        isEditable && "cursor-pointer"
                    )}
                    title={isEditable ? `Click to revoke ${assignee.user?.name || assignee.name || 'User'}` : (assignee.user?.name || assignee.name || 'Unknown User')}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isEditable && onRevokeAssigneeDirect) {
                            onRevokeAssigneeDirect(props.data, assignee);
                        }
                    }}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-full border border-white flex items-center justify-center text-white font-bold text-xs overflow-hidden shadow-sm",
                        assignee.user?.avatarUrl ? "" : getAvatarColor(assignee.user?.name || assignee.name || '?')
                    )}>
                        {assignee.user?.avatarUrl ? (
                            <img src={assignee.user.avatarUrl} alt={assignee.user?.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            (assignee.user?.name || assignee.name || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                </div>
            ))}
            {hiddenCount > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSwitchToUsersTab) onSwitchToUsersTab();
                    }}
                    className="w-6 h-6 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-500 hover:bg-gray-200 transition-colors z-0"
                    title={`View all ${count} assignees in Users tab`}
                >
                    +{hiddenCount}
                </button>
            )}
        </div>
    );
};

const SerialNoRenderer = (props: ICellRendererParams) => {
    const { level, serialNumber } = props.data;
    if (level === 0) {
        return <span className="text-gray-500 font-medium">{serialNumber}</span>;
    }
    return <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />;
};

const DEFAULT_COL_DEF = {
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
};

// Task Table Component
interface TaskTableProps {
    tasks: Task[];
    allTasks: Task[];
    workflow: WorkflowStage[];
    onUpdateStatus: (taskId: string, statusId: string) => void;
    onCreateSubtask?: (parentTask: Task) => void;
    expandedIds: Set<string>;
    onToggleExpand: (taskId: string) => void;
    isEditable?: boolean;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    onContextMenu: (event: any, task: Task) => void;
    onSwitchToUsersTab?: () => void;
    onRevokeAssigneeDirect?: (task: Task, assignee: any) => void;
}

function TaskTable({ tasks, allTasks, workflow, onUpdateStatus, onCreateSubtask, onEditTask, onDeleteTask, onContextMenu, expandedIds, onToggleExpand, isEditable = false, onSwitchToUsersTab, onRevokeAssigneeDirect }: TaskTableProps) {

    const gridDisplayData = useMemo(() => {
        const displayRows: any[] = [];

        const getSubtasksDisplay = (parentId: string) => allTasks.filter(t => t.parentId === parentId);
        const hasSubtasks = (taskId: string) => allTasks.some(t => t.parentId === taskId);

        // Recursive function to add tasks to displayRows
        const addTasksRecursive = (tasksToAdd: Task[], level: number) => {
            tasksToAdd.forEach((task, index) => {
                const hasChildren = hasSubtasks(task.id);
                const isExpanded = expandedIds.has(task.id);

                displayRows.push({
                    ...task,
                    isWrapper: false,
                    level,
                    hasChildren,
                    isExpanded,
                    serialNumber: level === 0 ? index + 1 : undefined
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

    const columnDefs: ColDef[] = useMemo(
        () => [
            {
                headerName: 'S.No',
                field: 'serialNumber',
                width: 65,
                pinned: 'left',
                cellRenderer: SerialNoRenderer,
                cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
                suppressMenu: true,
            },
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
                flex: 0.5,
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
                cellRenderer: AssigneeRenderer,
            },
        ],
        [] // No dependencies as renderers are external and context is passed via grid
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
                    z-index: 0; /* Default stacking order */
                }
                /* Raise z-index on hover so dropdowns in cells render on top of subsequent rows */
                .custom-ag-grid .ag-row:hover {
                    background-color: #f8fafc !important;
                    z-index: 50;
                }
                .custom-ag-grid .ag-cell {
                    padding-left: 16px;
                    padding-right: 16px;
                    display: flex;
                    align-items: center;
                    color: #0f172a;
                    font-size: 13px;
                    font-weight: 500;
                    overflow: visible !important; /* Critical: Allow dropdowns to overflow limits */
                }
                
                .custom-ag-grid .ag-row-selected {
                    background-color: #eff6ff !important;
                }
            `}</style>
            <AgGridReact
                theme="legacy"
                rowData={gridDisplayData}
                columnDefs={columnDefs}
                defaultColDef={DEFAULT_COL_DEF}
                rowHeight={60}
                headerHeight={40}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
                className="ag-theme-alpine"
                onCellContextMenu={(params) => {
                    if (params.data) {
                        onContextMenu(params.event, params.data);
                    }
                }}
                preventDefaultOnContextMenu={true}
                suppressRowClickSelection={true}
                context={{
                    onToggleExpand,
                    onCreateSubtask,
                    onEditTask,
                    onDeleteTask,
                    onUpdateStatus,
                    onRevokeAssigneeDirect,
                    allTasks,
                    workflow,
                    isEditable,
                    onSwitchToUsersTab // Passed from props
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
    isEditable?: boolean;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
}

function KanbanView({ tasks, allTasks, workflow, onUpdateStatus, onCreateSubtask, onEditTask, onDeleteTask, isEditable = false }: KanbanViewProps) {
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
        if (!draggedTask || !isEditable) return;

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
                                            draggable={isEditable}
                                            onDragStart={() => isEditable && setDraggedTask(task)}
                                            className={cn(
                                                "bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow group relative",
                                                isEditable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-sm font-medium text-gray-900 flex-1">
                                                    {task.title}
                                                </h4>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEditTask && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                                            className="p-1 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded transition-colors"
                                                            title="Edit Task"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {onDeleteTask && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                                            className="p-1 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded transition-colors"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {onCreateSubtask && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onCreateSubtask(task);
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-blue-600"
                                                            title="Add Subtask"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
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
                                                            year: 'numeric',
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

