'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    ICellRendererParams,
    ModuleRegistry,
    AllCommunityModule,
    GetRowIdParams,
} from 'ag-grid-community';
import type { RowDragEndEvent } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import {
    ChevronRight,
    ChevronDown,
    Plus,
    User,
    Layers,
    ListTodo,
    Pencil,
    Trash2,
    List as ListIcon,
    LayoutGrid,
    Eye,
    MoreHorizontal,
    FileText,
} from 'lucide-react';
import { PhaseViewModal } from './PhaseViewModal';
import { TaskListViewModal } from './TaskListViewModal';
import { cn, getAvatarColor } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
import {
    useStructuredPhases,
    useCreatePhase,
    useCreateTaskList,
    useMoveTask,
    useDeletePhase,
    useUpdatePhase,
    useReorderPhases,
    useReorderTaskLists,
} from '@/hooks/use-phases';
import { useCreateTask, useUpdateTask, useDeleteTask, useProjectWorkflow } from '@/hooks/use-tasks';
import { useProjectMembers } from '@/hooks/use-projects';
import { CreateTaskModal } from '@/components/ui/CreateTaskModal';
import { TaskViewModal } from '@/components/tasks/TaskViewModal';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists, TaskListWithTasks, StructuredTask } from '@/types/phase';
import type { CreateTaskPayload } from '@/types/task';

type RowType = 'phase' | 'tasklist' | 'task' | 'subtask';

interface FlatRow {
    rowId: string;
    rowType: RowType;
    level: number;
    phaseId: string;
    taskListId?: string;
    taskId?: string;

    name: string;
    status?: { id: string; name: string; color: string };
    assignees?: Array<{ id: string; name: string; email: string; avatarUrl?: string }>;
    tags?: Array<{ id: string; name: string; color: string }>;
    startDate?: string | null;
    dueDate?: string | null;
    priority?: number;

    childCount?: number;
    isExpanded?: boolean;
    hasChildren?: boolean;

    phaseData?: PhaseWithTaskLists;
    taskListData?: TaskListWithTasks;
    taskData?: StructuredTask;
}

type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface PhaseTaskListTabProps {
    projectId: string;
    isEditable: boolean;
    currentUserRole?: ProjectRole;
    searchQuery?: string;
}

function isAdmin(role?: ProjectRole): boolean {
    return role === 'ADMIN' || role === 'OWNER';
}

export default function PhaseTaskListTab({ projectId, isEditable, currentUserRole, searchQuery = '' }: PhaseTaskListTabProps) {
    const showViewButton = isAdmin(currentUserRole);
    const { data: phases = [], isLoading } = useStructuredPhases(projectId);
    const { data: workflow = [] } = useProjectWorkflow(projectId);
    const { data: members = [] } = useProjectMembers(projectId);
    const createPhaseMutation = useCreatePhase(projectId);
    const createTaskListMutation = useCreateTaskList(projectId);
    const createTaskMutation = useCreateTask(projectId);
    const updateTaskMutation = useUpdateTask(projectId);
    const deleteTaskMutation = useDeleteTask(projectId);
    const deletePhaseMutation = useDeletePhase(projectId);
    const moveTaskMutation = useMoveTask(projectId);
    const reorderPhasesMutation = useReorderPhases(projectId);
    const reorderTaskListsMutation = useReorderTaskLists(projectId);
    const toast = useToast();

    const gridRef = useRef<AgGridReact>(null);

    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
    const [expandedTaskLists, setExpandedTaskLists] = useState<Set<string>>(new Set());
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const isExpandedInitialized = useRef(false);

    const [showAddPhase, setShowAddPhase] = useState(false);
    const [phaseViewModalOpen, setPhaseViewModalOpen] = useState(false);
    const [phaseViewSelectedId, setPhaseViewSelectedId] = useState<string | null>(null);
    const [taskListViewModalOpen, setTaskListViewModalOpen] = useState(false);
    const [taskListViewSelectedId, setTaskListViewSelectedId] = useState<string | null>(null);
    const [addPhaseInput, setAddPhaseInput] = useState('');
    const [addTaskListInput, setAddTaskListInput] = useState<{ phaseId: string; value: string } | null>(null);

    const [createTaskModal, setCreateTaskModal] = useState<{
        isOpen: boolean;
        taskListId?: string;
        phaseId?: string;
        parentTask?: any;
        editingTask?: any;
    }>({ isOpen: false });

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        type: 'phase' | 'task';
        id: string;
        name: string;
    } | null>(null);

    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [taskViewModal, setTaskViewModal] = useState<{
        isOpen: boolean;
        selectedTaskId?: string | null;
        startInEditMode?: boolean;
    }>({ isOpen: false });
    const [contextMenu, setContextMenu] = useState<{
        row: FlatRow;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        if (phases.length > 0 && !isExpandedInitialized.current) {
            setExpandedPhases(new Set(phases.map(p => p.id)));
            const allTlIds = phases.flatMap(p => p.taskLists?.map(tl => tl.id) || []);
            setExpandedTaskLists(new Set(allTlIds));
            isExpandedInitialized.current = true;
        }
    }, [phases]);



    const togglePhase = useCallback((phaseId: string) => {
        setExpandedPhases(prev => {
            const n = new Set(prev);
            n.has(phaseId) ? n.delete(phaseId) : n.add(phaseId);
            return n;
        });
    }, []);

    const toggleTaskList = useCallback((taskListId: string) => {
        setExpandedTaskLists(prev => {
            const n = new Set(prev);
            n.has(taskListId) ? n.delete(taskListId) : n.add(taskListId);
            return n;
        });
    }, []);

    const toggleTask = useCallback((taskId: string) => {
        setExpandedTasks(prev => {
            const n = new Set(prev);
            n.has(taskId) ? n.delete(taskId) : n.add(taskId);
            return n;
        });
    }, []);

    const flatRows = useMemo<FlatRow[]>(() => {
        const rows: FlatRow[] = [];
        if (!phases) return rows;

        const countTasks = (items: StructuredTask[]): number =>
            (items || []).reduce((s, t) => s + 1 + countTasks(t.children || []), 0);

        phases.forEach((phase) => {
            const taskLists = phase.taskLists || [];
            const totalTasks = taskLists.reduce((sum, tl) => sum + countTasks(tl.tasks || []), 0);
            const isPhaseExpanded = expandedPhases.has(phase.id);

            rows.push({
                rowId: `phase-${phase.id}`,
                rowType: 'phase',
                level: 0,
                phaseId: phase.id,
                name: phase.name,
                startDate: phase.startDate,
                dueDate: phase.endDate,
                childCount: totalTasks,
                isExpanded: isPhaseExpanded,
                hasChildren: taskLists.length > 0,
                phaseData: phase,
            });

            if (isPhaseExpanded) {
                taskLists.forEach((taskList) => {
                    const tasks = taskList.tasks || [];
                    const isTaskListExpanded = expandedTaskLists.has(taskList.id);
                    const taskCount = countTasks(tasks);

                    rows.push({
                        rowId: `tasklist-${taskList.id}`,
                        rowType: 'tasklist',
                        level: 1,
                        phaseId: phase.id,
                        taskListId: taskList.id,
                        name: taskList.name,
                        childCount: taskCount,
                        isExpanded: isTaskListExpanded,
                        hasChildren: tasks.length > 0,
                        taskListData: taskList,
                    });

                    if (isTaskListExpanded) {
                        const addRows = (items: StructuredTask[], parentLevel: number) => {
                            (items || []).forEach((task) => {
                                const children = task.children || [];
                                const isTaskExpanded = expandedTasks.has(task.id);

                                rows.push({
                                    rowId: `task-${task.id}`,
                                    rowType: parentLevel === 2 ? 'task' : 'subtask',
                                    level: parentLevel,
                                    phaseId: phase.id,
                                    taskListId: taskList.id,
                                    taskId: task.id,
                                    name: task.title,
                                    status: task.status,
                                    assignees: task.assignees,
                                    tags: task.tags,
                                    startDate: null,
                                    dueDate: task.dueDate,
                                    priority: task.priority,
                                    childCount: children.length,
                                    isExpanded: isTaskExpanded,
                                    hasChildren: children.length > 0,
                                    taskData: task,
                                });

                                if (isTaskExpanded && children.length > 0) {
                                    addRows(children, parentLevel + 1);
                                }
                            });
                        };
                        addRows(tasks, 2);
                    }

                });
            }
        });

        return rows;
    }, [phases, expandedPhases, expandedTaskLists, expandedTasks, isEditable]);

    const filteredFlatRows = useMemo(() => {
        if (!searchQuery.trim()) return flatRows;
        const q = searchQuery.trim().toLowerCase();
        const matches = (name: string) => name.toLowerCase().includes(q);
        const ids = new Set<string>();
        flatRows.forEach((r) => { if (matches(r.name)) ids.add(r.rowId); });
        flatRows.forEach((r) => {
            if (r.rowType === 'tasklist' && flatRows.some((x) => x.taskListId === r.taskListId && ids.has(x.rowId)))
                ids.add(r.rowId);
        });
        flatRows.forEach((r) => {
            if (r.rowType === 'phase' && flatRows.some((x) => x.phaseId === r.phaseId && ids.has(x.rowId)))
                ids.add(r.rowId);
        });
        return flatRows.filter((r) => ids.has(r.rowId));
    }, [flatRows, searchQuery]);

    // Force AG Grid to completely redraw rows when the data or expansion state changes.
    // This ensures icons and indentation are always in sync with the current state.
    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.redrawRows();
        }
    }, [filteredFlatRows, expandedPhases, expandedTaskLists, expandedTasks]);

    // ====== Handlers ======

    const handleAddPhase = async () => {
        if (!addPhaseInput.trim()) return;
        const tid = toast.loading('Creating phase...');
        try {
            await createPhaseMutation.mutateAsync({ projectId, name: addPhaseInput.trim() });
            toast.success('Phase created', undefined, { id: tid });
            setAddPhaseInput('');
            setShowAddPhase(false);
        } catch {
            toast.error('Failed to create phase', undefined, { id: tid });
        }
    };

    const handleAddTaskList = async () => {
        if (!addTaskListInput?.value.trim()) return;
        const tid = toast.loading('Creating task list...');
        try {
            await createTaskListMutation.mutateAsync({
                projectId,
                phaseId: addTaskListInput.phaseId,
                name: addTaskListInput.value.trim(),
            });
            toast.success('Task list created', undefined, { id: tid });
            setAddTaskListInput(null);
        } catch {
            toast.error('Failed to create task list', undefined, { id: tid });
        }
    };

    const handleTaskSubmit = async (taskData: CreateTaskPayload) => {
        const tid = toast.loading(createTaskModal.editingTask ? 'Updating task...' : 'Creating task...');
        try {
            if (createTaskModal.editingTask) {
                const { taskListId: _tl, phaseId: _ph, ...updateData } = taskData;
                await updateTaskMutation.mutateAsync({
                    taskId: createTaskModal.editingTask.id,
                    data: updateData,
                });
                toast.success('Task updated', undefined, { id: tid });
            } else {
                await createTaskMutation.mutateAsync({
                    ...taskData,
                    taskListId: createTaskModal.taskListId || taskData.taskListId,
                    phaseId: createTaskModal.phaseId || taskData.phaseId,
                });
                toast.success('Task created', undefined, { id: tid });
            }
            setCreateTaskModal({ isOpen: false });
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Failed';
            toast.error('Failed', Array.isArray(msg) ? msg.join(', ') : msg, { id: tid });
            throw error;
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog) return;
        const tid = toast.loading('Deleting...');
        try {
            if (deleteDialog.type === 'phase') {
                await deletePhaseMutation.mutateAsync(deleteDialog.id);
            } else {
                await deleteTaskMutation.mutateAsync(deleteDialog.id);
            }
            toast.success('Deleted', undefined, { id: tid });
            setDeleteDialog(null);
        } catch {
            toast.error('Failed to delete', undefined, { id: tid });
        }
    };

    const handleUpdateStatus = useCallback(async (taskId: string, statusId: string) => {
        const tid = toast.loading('Updating status...');
        try {
            await updateTaskMutation.mutateAsync({ taskId, data: { statusId } });
            toast.success('Status updated', undefined, { id: tid });
        } catch {
            toast.error('Failed to update status', undefined, { id: tid });
        }
    }, [updateTaskMutation, toast]);

    const getRowId = useCallback((params: GetRowIdParams) => params.data.rowId, []);

    const getRowHeight = useCallback((params: any) => {
        const row = params.data as FlatRow;
        if (row.rowType === 'phase') return 48;
        if (row.rowType === 'tasklist') return 40;
        return 40;
    }, []);

    const getRowClass = useCallback((params: any) => {
        const row = params.data as FlatRow;
        if (row.rowType === 'phase') return 'phase-row group group/phase';
        if (row.rowType === 'tasklist') return 'tasklist-row group group/tl';
        return 'task-row group group/task';
    }, []);

    const handleRowDragEnd = useCallback(
        async (event: RowDragEndEvent) => {
            const { node, overNode } = event;
            if (!overNode?.data || !node?.data || !isEditable) return;
            const src = node.data as FlatRow;
            const tgt = overNode.data as FlatRow;

            // ——— Phase reorder ———
            if (src.rowType === 'phase' && src.phaseData) {
                const fromIdx = phases.findIndex((p) => p.id === src.phaseId);
                const toIdx = phases.findIndex((p) => p.id === tgt.phaseId);
                if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
                const newOrder = [...phases];
                const [removed] = newOrder.splice(fromIdx, 1);
                newOrder.splice(toIdx, 0, removed);
                const orderedIds = newOrder.map((p) => p.id);
                const tid = toast.loading('Reordering phases...');
                try {
                    await reorderPhasesMutation.mutateAsync({ orderedIds });
                    toast.success('Phases reordered', undefined, { id: tid });
                } catch {
                    toast.error('Failed to reorder phases', undefined, { id: tid });
                }
                return;
            }

            // ——— Task list reorder (within same phase) ———
            if (src.rowType === 'tasklist' && src.taskListData) {
                if (tgt.phaseId !== src.phaseId) {
                    toast.error('Move within phase', 'You can only reorder task lists within the same phase.');
                    return;
                }
                const phase = phases.find((p) => p.id === src.phaseId);
                const lists = [...(phase?.taskLists || [])];
                const fromIdx = lists.findIndex((tl) => tl.id === src.taskListId);
                if (fromIdx < 0) return;
                let toIdx = 0;
                if (tgt.rowType === 'tasklist' && tgt.taskListId) toIdx = lists.findIndex((tl) => tl.id === tgt.taskListId);
                else if (tgt.rowType === 'task' || tgt.rowType === 'subtask') toIdx = lists.findIndex((tl) => tl.id === tgt.taskListId);
                if (toIdx < 0) toIdx = 0;
                const [removed] = lists.splice(fromIdx, 1);
                lists.splice(toIdx, 0, removed);
                const orderedIds = lists.map((tl) => tl.id);
                const tid = toast.loading('Reordering task lists...');
                try {
                    await reorderTaskListsMutation.mutateAsync({ orderedIds });
                    toast.success('Task lists reordered', undefined, { id: tid });
                } catch {
                    toast.error('Failed to reorder task lists', undefined, { id: tid });
                }
                return;
            }

            // ——— Task / subtask move ———
            if (src.rowType !== 'task' && src.rowType !== 'subtask') return;
            if (!src.taskId) return;
            if (tgt.taskId && src.taskId === tgt.taskId) return;

            let newTaskListId: string | undefined;
            let newPhaseId: string | undefined;
            let newOrderIndex = 0;

            if (tgt.rowType === 'phase') {
                const phase = phases.find((p) => p.id === tgt.phaseId);
                const firstTl = phase?.taskLists?.[0];
                if (!firstTl) {
                    toast.error('No task list', 'This phase has no task lists. Create one first.');
                    return;
                }
                newTaskListId = firstTl.id;
                newPhaseId = tgt.phaseId;
            } else if (tgt.rowType === 'tasklist') {
                newTaskListId = tgt.taskListId!;
                newPhaseId = tgt.phaseId;
            } else if (tgt.rowType === 'task' || tgt.rowType === 'subtask') {
                newTaskListId = tgt.taskListId!;
                newPhaseId = tgt.phaseId;
                const phase = phases.find((p) => p.id === tgt.phaseId);
                const tl = phase?.taskLists?.find((tl) => tl.id === tgt.taskListId);
                const flattenTasks = (items: StructuredTask[]): StructuredTask[] =>
                    items.flatMap((t) => [t, ...flattenTasks(t.children || [])]);
                const tasks = tl ? flattenTasks(tl.tasks || []) : [];
                const idx = tasks.findIndex((t) => t.id === tgt.taskId);
                newOrderIndex = idx >= 0 ? idx + 1 : 0;
            } else {
                return;
            }

            const tid = toast.loading('Moving task...');
            try {
                await moveTaskMutation.mutateAsync({
                    taskId: src.taskId,
                    data: { newTaskListId, newPhaseId, newOrderIndex },
                });
                toast.success('Task moved', undefined, { id: tid });
            } catch {
                toast.error('Failed to move task', undefined, { id: tid });
            }
        },
        [phases, isEditable, moveTaskMutation, reorderPhasesMutation, reorderTaskListsMutation, toast]
    );

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: 'Task Name',
            field: 'name',
            flex: 2,
            minWidth: 320,
            cellRenderer: TaskNameCell,
            cellClass: '!p-0',
            rowDrag: (params) => {
                const type = params.data?.rowType;
                return isEditable && (type === 'phase' || type === 'tasklist' || type === 'task' || type === 'subtask');
            },
        },
        {
            headerName: '',
            field: '_viewBtn',
            width: 60,
            suppressMenu: true,
            sortable: false,
            filter: false,
            cellRenderer: ViewButtonCell,
            cellClass: '!p-0',
        },
        {
            headerName: 'Status',
            field: 'status',
            width: 150,
            cellRenderer: StatusCell,
            cellClass: '!p-0',
        },
        {
            headerName: 'Owner',
            field: 'assignees',
            width: 140,
            cellRenderer: OwnerCell,
            cellClass: '!p-0',
        },
        {
            headerName: 'Tags',
            field: 'tags',
            width: 120,
            cellRenderer: TagsCell,
            cellClass: '!p-0',
        },
        {
            headerName: 'Start Date',
            field: 'startDate',
            width: 120,
            cellRenderer: DateCell,
            cellClass: '!p-0',
        },
        {
            headerName: 'Due Date',
            field: 'dueDate',
            width: 120,
            cellRenderer: DateCell,
            cellClass: '!p-0',
        },
    ], [isEditable, showViewButton]);

    const defaultColDef: ColDef = useMemo(() => ({
        sortable: false,
        filter: false,
        resizable: true,
        suppressMenu: true,
    }), []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    const toolbarSlot = typeof document !== 'undefined' ? document.getElementById('tasks-toolbar-slot') : null;
    const toolbarEl = toolbarSlot && (
        <div className="flex items-center gap-2">
            {/* Group By */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                <LayoutGrid className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Group By:</span>
                <span className="text-xs font-bold text-gray-800">Phases</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* View Toggle - icons only */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "p-1.5 transition-colors",
                        viewMode === 'list' ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    title="List view"
                >
                    <ListIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setViewMode('board')}
                    className={cn(
                        "p-1.5 transition-colors",
                        viewMode === 'board' ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    title="Board view"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>

            {/* Add dropdown - hover shows Add task, Add phase, Add task list */}
            {isEditable && (
                <div className="relative group/add">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" />
                        Add
                        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </button>
                    <div className="absolute right-0 top-full pt-1 min-w-[160px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-opacity z-50">
                        <button
                            onClick={() => {
                                const firstPhase = phases[0];
                                const firstTl = firstPhase?.taskLists?.[0];
                                if (firstTl) {
                                    setCreateTaskModal({ isOpen: true, taskListId: firstTl.id, phaseId: firstPhase.id });
                                } else if (firstPhase) {
                                    toast.error('Create a Task List first', 'You need at least one task list before adding tasks.');
                                } else {
                                    toast.error('Create a Phase first', 'You need at least one phase before adding tasks.');
                                }
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 text-gray-700"
                        >
                            <Plus className="w-4 h-4 text-emerald-500" />
                            Add Task
                        </button>
                        <button
                            onClick={() => setShowAddPhase(true)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 text-gray-700"
                        >
                            <Layers className="w-4 h-4 text-indigo-500" />
                            Add Phase
                        </button>
                        <button
                            onClick={() => {
                                const firstPhase = phases[0];
                                if (firstPhase) {
                                    setAddTaskListInput({ phaseId: firstPhase.id, value: '' });
                                } else {
                                    toast.error('Create a Phase first', 'You need at least one phase before adding task lists.');
                                }
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 text-gray-700"
                        >
                            <ListTodo className="w-4 h-4 text-emerald-500" />
                            Add Task List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white">
            {toolbarSlot && createPortal(toolbarEl, toolbarSlot)}

            {/* Add Phase Input */}
            {showAddPhase && (
                <div className="px-4 py-2.5 border-b border-gray-200 bg-indigo-50/40 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Phase name (e.g. Sprint 1, Planning)"
                        value={addPhaseInput}
                        onChange={(e) => setAddPhaseInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddPhase();
                            if (e.key === 'Escape') { setShowAddPhase(false); setAddPhaseInput(''); }
                        }}
                        className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
                    />
                    <button
                        onClick={handleAddPhase}
                        disabled={!addPhaseInput.trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        Create
                    </button>
                    <button onClick={() => { setShowAddPhase(false); setAddPhaseInput(''); }} className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
                        Cancel
                    </button>
                </div>
            )}

            {/* Content: List or Board */}
            {viewMode === 'list' ? (
                <div className="flex-1 ag-theme-alpine phase-grid-v2">
                    <style jsx global>{`
                    .phase-grid-v2 .ag-root-wrapper {
                        border: none !important;
                        border-radius: 0 !important;
                    }
                    .phase-grid-v2 .ag-header {
                        background-color: #f8fafc !important;
                        border-bottom: 2px solid #e2e8f0 !important;
                        min-height: 38px !important;
                    }
                    .phase-grid-v2 .ag-header-row {
                        height: 38px !important;
                    }
                    .phase-grid-v2 .ag-header-cell {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                    .phase-grid-v2 .ag-header-cell-label {
                        font-weight: 700;
                        color: #6b7280 !important;
                        font-size: 10px;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                    }

                    /* Phase row */
                    .phase-grid-v2 .ag-row.phase-row {
                        background-color: #f1f5f9 !important;
                        border-bottom: 1px solid #cbd5e1;
                        border-left: 4px solid #6366f1;
                    }
                    .phase-grid-v2 .ag-row.phase-row:hover {
                        background-color: #e8ecf1 !important;
                    }

                    /* TaskList row */
                    .phase-grid-v2 .ag-row.tasklist-row {
                        background-color: #fafbfc !important;
                        border-bottom: 1px solid #eef1f5;
                        border-left: 4px solid #10b981;
                    }
                    .phase-grid-v2 .ag-row.tasklist-row:hover {
                        background-color: #f5f7fa !important;
                    }

                    /* Task row */
                    .phase-grid-v2 .ag-row.task-row {
                        background-color: #ffffff !important;
                        border-bottom: 1px solid #f1f5f9;
                        border-left: 4px solid transparent;
                    }
                    .phase-grid-v2 .ag-row.task-row:hover {
                        background-color: #f8faff !important;
                        border-left-color: #818cf8;
                    }

                    .phase-grid-v2 .ag-cell {
                        display: flex;
                        align-items: center;
                        font-size: 13px;
                        color: #1e293b;
                        overflow: hidden !important;
                    }
                    .phase-grid-v2 .ag-body-viewport { overflow-y: auto !important; }
                `}</style>
                    <AgGridReact
                        ref={gridRef}
                        theme="legacy"
                        rowData={filteredFlatRows}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        getRowId={getRowId}
                        getRowHeight={getRowHeight}
                        getRowClass={getRowClass}
                        animateRows={true}
                        suppressRowClickSelection={true}
                        rowDragManaged={false}
                        onRowDragEnd={handleRowDragEnd}
                        isRowValidDropPosition={(params) => {
                            const src = params.source?.data as FlatRow;
                            const tgt = params.target?.data as FlatRow;
                            if (!src || !tgt) return false;
                            if (src.taskId && tgt.taskId && src.taskId === tgt.taskId) return false;
                            if (tgt.rowType === 'phase' || tgt.rowType === 'tasklist' || tgt.rowType === 'task' || tgt.rowType === 'subtask') {
                                return { rows: params.rows, position: 'below' as const, target: params.target, allowed: true };
                            }
                            return false;
                        }}
                        onCellContextMenu={(params) => {
                            if (params.data && params.event) {
                                params.event.preventDefault();
                                const row = params.data as FlatRow;
                                setContextMenu({
                                    row,
                                    x: (params.event as MouseEvent).clientX,
                                    y: (params.event as MouseEvent).clientY,
                                });
                            }
                        }
                        }
                        preventDefaultOnContextMenu={true}
                        context={{
                            togglePhase,
                            toggleTaskList,
                            toggleTask,
                            isEditable,
                            showViewButton,
                            workflow,
                            onUpdateStatus: handleUpdateStatus,
                            onAddTaskList: (phaseId: string) => setAddTaskListInput({ phaseId, value: '' }),
                            onAddTask: (taskListId: string, phaseId: string) =>
                                setCreateTaskModal({ isOpen: true, taskListId, phaseId }),
                            onEditTask: (task: StructuredTask) =>
                                setTaskViewModal({ isOpen: true, selectedTaskId: task.id, startInEditMode: true }),
                            onViewTask: (taskId: string) =>
                                setTaskViewModal({ isOpen: true, selectedTaskId: taskId, startInEditMode: false }),
                            onViewPhase: (phaseId: string) => {
                                setPhaseViewSelectedId(phaseId);
                                setPhaseViewModalOpen(true);
                            },
                            onViewTaskList: (taskListId: string) => {
                                setTaskListViewSelectedId(taskListId);
                                setTaskListViewModalOpen(true);
                            },
                            onDeletePhase: (phaseId: string, name: string) =>
                                setDeleteDialog({ isOpen: true, type: 'phase', id: phaseId, name }),
                            onDeleteTask: (taskId: string, name: string) =>
                                setDeleteDialog({ isOpen: true, type: 'task', id: taskId, name }),
                            onCreateSubtask: (parentTask: StructuredTask, taskListId: string) =>
                                setCreateTaskModal({ isOpen: true, taskListId, parentTask }),
                        }}
                    />
                </div>
            ) : (
                <TasksBoardView
                    phases={phases}
                    workflow={workflow}
                    isEditable={isEditable}
                    searchQuery={searchQuery}
                    onUpdateStatus={handleUpdateStatus}
                    onEditTask={(task) => setTaskViewModal({ isOpen: true, selectedTaskId: task.id, startInEditMode: true })}
                    onViewTask={(taskId) => setTaskViewModal({ isOpen: true, selectedTaskId: taskId, startInEditMode: false })}
                    onDeleteTask={(taskId, name) => setDeleteDialog({ isOpen: true, type: 'task', id: taskId, name })}
                    onCreateSubtask={(task) => setCreateTaskModal({ isOpen: true, parentTask: task, taskListId: (task as any).taskListId })}
                />
            )}

            {/* Add TaskList Modal */}
            {addTaskListInput && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={() => setAddTaskListInput(null)}>
                    <div className="bg-white rounded-md shadow-2xl border border-gray-200 p-5 w-[400px]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <ListTodo className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">New Task List</h3>
                                <p className="text-[11px] text-gray-400">Create a new list to group tasks</p>
                            </div>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Backend, Frontend, QA..."
                            value={addTaskListInput.value}
                            onChange={(e) => setAddTaskListInput({ ...addTaskListInput, value: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTaskList();
                                if (e.key === 'Escape') setAddTaskListInput(null);
                            }}
                            className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setAddTaskListInput(null)} className="px-3.5 py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold">Cancel</button>
                            <button
                                onClick={handleAddTaskList}
                                disabled={!addTaskListInput.value.trim()}
                                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Create List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Task Modal */}
            {createTaskModal.isOpen && (
                <CreateTaskModal
                    isOpen={createTaskModal.isOpen}
                    onClose={() => setCreateTaskModal({ isOpen: false })}
                    onSubmit={handleTaskSubmit}
                    workflow={workflow}
                    parentTask={createTaskModal.parentTask || null}
                    initialData={createTaskModal.editingTask || undefined}
                    taskListId={createTaskModal.taskListId}
                    phaseId={createTaskModal.phaseId}
                    members={members}
                />
            )}

            {/* Delete Dialog */}
            {deleteDialog && (
                <Dialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog(null)}
                    type="warning"
                    title={`Delete ${deleteDialog.type === 'phase' ? 'Phase' : 'Task'}`}
                    message={`Are you sure you want to delete "${deleteDialog.name}"?`}
                    description={deleteDialog.type === 'phase' ? 'All task lists and tasks inside will be permanently deleted.' : 'This action cannot be undone.'}
                    confirmText="Delete"
                    confirmVariant="destructive"
                    onConfirm={handleDeleteConfirm}
                />
            )}

            {/* Task View Modal - edit & delete happen inside */}
            <TaskViewModal
                isOpen={taskViewModal.isOpen}
                onClose={() => setTaskViewModal({ isOpen: false })}
                projectId={projectId}
                phases={phases}
                selectedTaskId={taskViewModal.selectedTaskId}
                startInEditMode={taskViewModal.startInEditMode}
                isEditable={isEditable}
                workflow={workflow}
                members={members}
                onUpdateTask={async (taskId, data) => {
                    await updateTaskMutation.mutateAsync({ taskId, data });
                    toast.success('Task updated');
                }}
                onDeleteTask={async (taskId) => {
                    await deleteTaskMutation.mutateAsync(taskId);
                    toast.success('Task deleted');
                }}
                onTaskUpdated={() => { }}
                onTaskDeleted={() => { }}
            />

            {/* Phase View Modal - list phases, right panel view/edit/delete */}
            <PhaseViewModal
                isOpen={phaseViewModalOpen}
                onClose={() => { setPhaseViewModalOpen(false); setPhaseViewSelectedId(null); }}
                projectId={projectId}
                phases={phases}
                selectedPhaseId={phaseViewSelectedId}
                isEditable={isEditable}
                onUpdated={() => { }}
                onDeleted={() => { }}
            />

            {/* Task List View Modal - list task lists, right panel view/edit/delete */}
            <TaskListViewModal
                isOpen={taskListViewModalOpen}
                onClose={() => { setTaskListViewModalOpen(false); setTaskListViewSelectedId(null); }}
                projectId={projectId}
                phases={phases}
                selectedTaskListId={taskListViewSelectedId}
                isEditable={isEditable}
                onUpdated={() => { }}
                onDeleted={() => { }}
            />

            {/* Row Context Menu */}
            {contextMenu && (
                <RowContextMenu
                    row={contextMenu.row}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    isEditable={isEditable}
                    onAddTaskList={() => { setAddTaskListInput({ phaseId: contextMenu.row.phaseId, value: '' }); setContextMenu(null); }}
                    onAddTask={() => { setCreateTaskModal({ isOpen: true, taskListId: contextMenu.row.taskListId!, phaseId: contextMenu.row.phaseId }); setContextMenu(null); }}
                    onEditTask={() => { setTaskViewModal({ isOpen: true, selectedTaskId: contextMenu.row.taskId!, startInEditMode: true }); setContextMenu(null); }}
                    onDeletePhase={() => { setDeleteDialog({ isOpen: true, type: 'phase', id: contextMenu.row.phaseId, name: contextMenu.row.name }); setContextMenu(null); }}
                    onDeleteTask={() => { setDeleteDialog({ isOpen: true, type: 'task', id: contextMenu.row.taskId!, name: contextMenu.row.name }); setContextMenu(null); }}
                    onCreateSubtask={() => { setCreateTaskModal({ isOpen: true, parentTask: contextMenu.row.taskData, taskListId: contextMenu.row.taskListId }); setContextMenu(null); }}
                />
            )}

            <ToastContainer />
        </div>
    );
}

// ============================================================================
// TASKS BOARD VIEW (Kanban by workflow stage)
// ============================================================================

function TasksBoardView({
    phases,
    workflow,
    isEditable,
    searchQuery = '',
    onUpdateStatus,
    onEditTask,
    onViewTask,
    onDeleteTask,
    onCreateSubtask,
}: {
    phases: PhaseWithTaskLists[];
    workflow: any[];
    isEditable: boolean;
    searchQuery?: string;
    onUpdateStatus: (taskId: string, statusId: string) => void;
    onEditTask: (task: any) => void;
    onViewTask?: (taskId: string) => void;
    onDeleteTask: (taskId: string, name: string) => void;
    onCreateSubtask: (task: any) => void;
}) {
    const [draggedTask, setDraggedTask] = useState<any>(null);

    const allTasks = useMemo(() => {
        const out: any[] = [];
        phases.forEach(p => {
            (p.taskLists || []).forEach(tl => {
                const add = (items: StructuredTask[], parentId?: string) => {
                    (items || []).forEach(t => {
                        out.push({ ...t, parentId: parentId || null, taskListId: tl.id });
                        if (t.children?.length) add(t.children, t.id);
                    });
                };
                add(tl.tasks || []);
            });
        });
        return out;
    }, [phases]);

    const filteredTasks = useMemo(() => {
        if (!searchQuery.trim()) return allTasks;
        const q = searchQuery.trim().toLowerCase();
        return allTasks.filter((t: any) => t.title?.toLowerCase().includes(q));
    }, [allTasks, searchQuery]);

    const parentTasks = useMemo(() => filteredTasks.filter(t => !t.parentId), [filteredTasks]);

    const getTasksByStage = (stageId: string) => {
        const stage = workflow.find((s: any) => s.id === stageId);
        if (!stage) return [];
        return parentTasks.filter((task: any) =>
            stage.statuses.some((s: any) => s.id === task.status?.id)
        );
    };

    const getSubtasks = (parentId: string) => filteredTasks.filter((t: any) => t.parentId === parentId);

    const handleDrop = (stageId: string) => {
        if (!draggedTask || !isEditable) return;
        const stage = workflow.find((s: any) => s.id === stageId);
        const defaultStatus = stage?.statuses?.find((s: any) => s.isDefault) || stage?.statuses?.[0];
        if (defaultStatus && draggedTask.status?.id !== defaultStatus.id) {
            onUpdateStatus(draggedTask.id, defaultStatus.id);
        }
        setDraggedTask(null);
    };

    return (
        <div className="h-full overflow-x-auto p-4 bg-gray-50">
            <div className="flex gap-4 h-full min-w-0">
                {workflow.map((stage: any) => {
                    const stageTasks = getTasksByStage(stage.id);
                    return (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 flex flex-col"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            <div className="p-3 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{stageTasks.length}</span>
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {stageTasks.map((task: any) => {
                                    const subtasks = getSubtasks(task.id);
                                    return (
                                        <div
                                            key={task.id}
                                            draggable={isEditable}
                                            onDragStart={() => isEditable && setDraggedTask(task)}
                                            className={cn(
                                                "bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow transition-shadow group",
                                                isEditable && "cursor-grab active:cursor-grabbing"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-1 mb-1">
                                                <h4 className="text-sm font-medium text-gray-900 flex-1 line-clamp-2">{task.title}</h4>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                                                    {onViewTask && (
                                                        <button onClick={() => onViewTask(task.id)} className="p-1 hover:bg-indigo-50 rounded" title="View"><Eye className="w-3 h-3 text-indigo-600" /></button>
                                                    )}
                                                    {isEditable && (
                                                        <>
                                                            <button onClick={() => onEditTask(task)} className="p-1 hover:bg-blue-50 rounded" title="Edit"><Pencil className="w-3 h-3" /></button>
                                                            <button onClick={() => onDeleteTask(task.id, task.title)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                                            <button onClick={() => onCreateSubtask(task)} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {subtasks.length > 0 && (
                                                <div className="text-[10px] text-gray-500 mt-1">{subtasks.length} subtask(s)</div>
                                            )}
                                        </div>
                                    );
                                })}
                                {stageTasks.length === 0 && <div className="text-center py-6 text-gray-400 text-xs">No tasks</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// ROW CONTEXT MENU (Phase, TaskList, Task)
// ============================================================================

function RowContextMenu({
    row,
    x,
    y,
    onClose,
    isEditable,
    onAddTaskList,
    onAddTask,
    onEditTask,
    onDeletePhase,
    onDeleteTask,
    onCreateSubtask,
}: {
    row: FlatRow;
    x: number;
    y: number;
    onClose: () => void;
    isEditable: boolean;
    onAddTaskList: () => void;
    onAddTask: () => void;
    onEditTask: () => void;
    onDeletePhase: () => void;
    onDeleteTask: () => void;
    onCreateSubtask: () => void;
}) {
    return (
        <>
            <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
                {row.rowType === 'phase' && (
                    <>
                        {isEditable && <button onClick={onAddTaskList} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Plus className="w-4 h-4 text-indigo-500" />Add Task List</button>}
                        {isEditable && <><div className="h-px bg-gray-100 my-1" /><button onClick={onDeletePhase} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" />Delete Phase</button></>}
                    </>
                )}
                {row.rowType === 'tasklist' && (
                    <>
                        {isEditable && <button onClick={onAddTask} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Plus className="w-4 h-4 text-emerald-500" />Add Task</button>}
                        {isEditable && <button onClick={onAddTaskList} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Plus className="w-4 h-4 text-indigo-500" />Add Task List</button>}
                    </>
                )}
                {(row.rowType === 'task' || row.rowType === 'subtask') && (
                    <>
                        <button onClick={onEditTask} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Pencil className="w-4 h-4" />View / Edit</button>
                        {isEditable && <button onClick={onCreateSubtask} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Plus className="w-4 h-4" />Add Subtask</button>}
                        {isEditable && <><div className="h-px bg-gray-100 my-1" /><button onClick={onDeleteTask} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" />Delete Task</button></>}
                    </>
                )}
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose} />
        </>
    );
}

// ============================================================================
// CELL RENDERERS
// ============================================================================

function TaskNameCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    const ctx = params.context;

    // ---- PHASE ROW ----
    if (row.rowType === 'phase') {
        return (
            <div className="flex items-center h-full w-full px-2 pr-3 group/phase">
                {row.hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); ctx.togglePhase(row.phaseId); }}
                        className="p-1 mr-1 hover:bg-white/60 rounded transition-colors"
                    >
                        {row.isExpanded
                            ? <ChevronDown className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                            : <ChevronRight className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                        }
                    </button>
                ) : (
                    <div className="w-6 mr-1" />
                )}
                <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                    <Layers className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[13px] text-gray-800 truncate uppercase tracking-wide flex-1 min-w-0" title={row.name}>
                    {row.name.length > 20 ? row.name.substring(0, 20) + '...' : row.name}
                </span>
                {ctx.isEditable && (
                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); ctx.onAddTaskList(row.phaseId); }}
                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white/80 rounded transition-colors flex items-center gap-0.5"
                            title="Add Task List"
                        >
                            <ListTodo className="w-4 h-4" />
                            <Plus className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); ctx.onDeletePhase(row.phaseId, row.name); }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-white/80 rounded transition-colors"
                            title="Delete Phase"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ---- TASKLIST ROW ----
    if (row.rowType === 'tasklist') {
        const indent = row.level * 24 + 8;
        return (
            <div className="flex items-center h-full w-full pr-3 group/tl" style={{ paddingLeft: `${indent}px` }}>
                {row.hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); ctx.toggleTaskList(row.taskListId!); }}
                        className="p-1 mr-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        {row.isExpanded
                            ? <ChevronDown className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                            : <ChevronRight className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                        }
                    </button>
                ) : (
                    <div className="w-6 mr-1" />
                )}
                <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                    <ListTodo className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-[13px] text-gray-700 truncate flex-1 min-w-0" title={row.name}>
                    {row.name.length > 60 ? row.name.substring(0, 60) + '...' : row.name}
                </span>
                {row.childCount !== undefined && (
                    <span className="ml-1.5 text-[10px] text-gray-400 font-bold">
                        ({row.childCount})
                    </span>
                )}
                {ctx.isEditable && (
                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover/tl:opacity-100 transition-opacity pr-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); ctx.onAddTask(row.taskListId!, row.phaseId); }}
                            className="inline-flex items-center gap-0.5 p-1 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors group/btn-task"
                            title="Add Task"
                        >
                            <FileText className="w-4 h-4" />
                            <Plus className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); ctx.onAddTaskList(row.phaseId); }}
                            className="inline-flex items-center gap-0.5 p-1 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors group/btn-tl"
                            title="Add Task List"
                        >
                            <ListTodo className="w-4 h-4" />
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ---- TASK / SUBTASK ROW ----
    const indent = row.level * 24 + 8;
    return (
        <div className="flex items-center h-full w-full pr-3 group/task" style={{ paddingLeft: `${indent}px` }}>
            {row.hasChildren ? (
                <button
                    onClick={(e) => { e.stopPropagation(); ctx.toggleTask(row.taskId!); }}
                    className="p-1 mr-1 hover:bg-gray-100 rounded transition-colors"
                >
                    {row.isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-500 stroke-[2.5]" />
                        : <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
                    }
                </button>
            ) : (
                <div className="w-6 mr-1 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-gray-300" />
                </div>
            )}
            <span
                className={cn(
                    "text-[13px] truncate flex-1 min-w-0",
                    row.rowType === 'subtask' ? 'text-gray-500' : 'text-gray-800 font-medium'
                )}
                title={row.name}
            >
                {row.name.length > 60 ? row.name.substring(0, 60) + '...' : row.name}
            </span>
            {row.hasChildren && row.childCount! > 0 && (
                <span className="ml-1.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                    {row.childCount}
                </span>
            )}
            {ctx.isEditable && (
                <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity pr-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); ctx.onCreateSubtask(row.taskData, row.taskListId); }}
                        className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Add Subtask"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); ctx.onEditTask?.(row.taskData); }}
                        className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); ctx.onDeleteTask(row.taskId, row.name); }}
                        className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function ViewButtonCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    const ctx = params.context as {
        showViewButton?: boolean;
        onViewTask?: (taskId: string) => void;
        onViewPhase?: (phaseId: string) => void;
        onViewTaskList?: (taskListId: string) => void;
    };
    const showView = ctx?.showViewButton;
    if (row.rowType === 'phase' && showView) {
        return (
            <div className="flex items-center h-full justify-center opacity-0 group-hover/phase:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); ctx.onViewPhase?.(row.phaseId); }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors"
                >
                    <Eye className="w-3 h-3" />
                    View
                </button>
            </div>
        );
    }
    if (row.rowType === 'tasklist' && showView) {
        return (
            <div className="flex items-center h-full justify-center opacity-0 group-hover/tl:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); ctx.onViewTaskList?.(row.taskListId!); }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded hover:bg-emerald-100 transition-colors"
                >
                    <Eye className="w-3 h-3" />
                    View
                </button>
            </div>
        );
    }
    if (row.rowType !== 'task' && row.rowType !== 'subtask') return null;
    return (
        <div className="flex items-center h-full justify-center opacity-0 group-hover/task:opacity-100 transition-opacity">
            <button
                onClick={() => ctx.onViewTask?.(row.taskId!)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors"
            >
                <Eye className="w-3 h-3" />
                View
            </button>
        </div>
    );
}

function StatusCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    const ctx = params.context;

    /* Phase row: no status in backend – hide for now */
    if (row.rowType === 'phase') return null;
    if (row.rowType === 'tasklist') return null;

    const statusName = (row.status?.name || '').toLowerCase();
    const isNotStarted = statusName.includes('not started') || statusName.includes('not_started');
    const { workflow = [], onUpdateStatus, isEditable } = ctx || {};

    if (!row.status) return <div className="px-2"><span className="text-[10px] font-medium text-gray-400">-</span></div>;

    const allStatuses = workflow.flatMap((s: any) => (s.statuses || []).map((st: any) => ({ ...st, stageName: s.name })));
    const color = row.status.color || '#64748b';
    const chipStyle = isNotStarted
        ? undefined
        : { backgroundColor: `${color}18`, color, borderColor: 'transparent' };
    const chipClass = isNotStarted
        ? 'bg-slate-200 text-slate-800 border-0'
        : 'border-0';

    /* Editable: project-like select with chevron */
    if (isEditable && row.taskId) {
        return (
            <div className="status-select-wrapper h-full w-full max-w-[140px] flex items-center px-2" onClick={(e) => e.stopPropagation()}>
                <select
                    value={row.status.id}
                    onChange={(e) => onUpdateStatus?.(row.taskId!, e.target.value)}
                    className={cn('status-select-base flex items-center justify-center rounded-sm', chipClass)}
                    style={{
                        ...chipStyle,
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                    }}
                >
                    {allStatuses.map((st: any) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                </select>
                <ChevronDown className="status-select-icon" style={chipStyle ? { color } : undefined} />
            </div>
        );
    }

    /* Read-only: minimal chip like project (no chevron) */
    return (
        <div className="flex items-center h-full px-2">
            <span
                className={cn(
                    'flex items-center justify-center px-3 py-1.5 text-[10px] font-bold tracking-wide rounded-sm',
                    chipClass
                )}
                style={chipStyle}
            >
                {row.status.name}
            </span>
        </div>
    );
}

function OwnerCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    if (row.rowType === 'tasklist') return null;

    if (row.rowType === 'phase') {
        return (
            <div className="flex items-center h-full px-2">
                <span className="text-xs text-gray-400 font-medium">-</span>
            </div>
        );
    }

    const assignees = row.assignees || [];
    if (assignees.length === 0) {
        return (
            <div className="flex items-center h-full px-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wide bg-slate-200 text-slate-800 border-0 rounded-sm">
                    <User className="w-3 h-3 text-slate-500" />
                    Unassigned
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center h-full px-2 gap-1.5">
            <div className="flex -space-x-1.5">
                {assignees.slice(0, 2).map((a) => (
                    <div
                        key={a.id}
                        className={cn(
                            "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm",
                            a.avatarUrl ? '' : getAvatarColor(a.name)
                        )}
                        title={a.name}
                    >
                        {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            a.name.charAt(0).toUpperCase()
                        )}
                    </div>
                ))}
            </div>
            {assignees.length === 1 && (
                <span className="text-[11px] text-gray-600 font-medium truncate max-w-[60px]">{assignees[0].name.split(' ')[0]}</span>
            )}
            {assignees.length > 2 && (
                <span className="text-[10px] text-gray-400 font-bold">+{assignees.length - 2}</span>
            )}
        </div>
    );
}

function TagsCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    if (row.rowType !== 'task' && row.rowType !== 'subtask') return null;

    const tags = row.tags || [];
    if (tags.length === 0) return <div className="px-2"><span className="text-[10px] font-medium text-gray-400">-</span></div>;

    return (
        <div className="flex items-center h-full px-2 gap-1 overflow-hidden">
            {tags.slice(0, 2).map((tag) => (
                <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide border-0 truncate max-w-[55px]"
                    style={{
                        backgroundColor: `${tag.color}18`,
                        color: tag.color,
                    }}
                >
                    {tag.name}
                </span>
            ))}
            {tags.length > 2 && <span className="text-[10px] text-gray-400 font-bold">+{tags.length - 2}</span>}
        </div>
    );
}

function DateCell(params: ICellRendererParams) {
    const row = params.data as FlatRow;
    if (row.rowType === 'tasklist') return null;

    const dateStr = params.value;
    if (!dateStr) return <div className="px-2"><span className="text-[10px] font-medium text-gray-400">-</span></div>;

    const d = new Date(dateStr);
    const formatted = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const isPast = d < new Date() && row.rowType !== 'phase';

    return (
        <div className="flex items-center h-full px-2">
            <span className={cn('text-[11px] font-medium', isPast ? 'text-red-500' : 'text-gray-600')}>
                {formatted}
            </span>
        </div>
    );
}
