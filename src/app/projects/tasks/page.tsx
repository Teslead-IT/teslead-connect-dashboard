'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

import { List as ListIcon, Search, MoreVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useMyTasks, useUpdateTask, useProjectWorkflow } from '@/hooks/use-tasks';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { MyTask, MyTaskTag } from '@/types/task';

// Priority labels (1=highest, 5=lowest)
const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: 'Urgent', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    2: { label: 'High', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    3: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    4: { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    5: { label: 'Lowest', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function StatusDropdown({ taskId, projectId, currentStatus }: { taskId: string, projectId: string, currentStatus: any }) {
    const { data: workflow = [] } = useProjectWorkflow(projectId);
    const updateTaskMutation = useUpdateTask(projectId);
    const toast = useToast();

    // Local state for immediate feedback
    const [localStatusId, setLocalStatusId] = useState(currentStatus.id);

    // Sync local state with prop when it changes from server
    useEffect(() => {
        setLocalStatusId(currentStatus.id);
    }, [currentStatus.id]);

    const allStatuses = useMemo(() =>
        workflow.flatMap((stage: any) => (stage.statuses || []).map((st: any) => ({ ...st, stageName: stage.name })))
        , [workflow]);

    const selectedStatus = useMemo(() => {
        if (localStatusId === currentStatus.id) return currentStatus;
        return allStatuses.find(s => s.id === localStatusId) || currentStatus;
    }, [localStatusId, currentStatus, allStatuses]);

    const handleStatusChange = async (newStatusId: string) => {
        if (newStatusId === localStatusId) return;

        // Optimistically update local state
        setLocalStatusId(newStatusId);

        const tid = toast.loading('Updating status...');
        try {
            await updateTaskMutation.mutateAsync({ taskId, data: { statusId: newStatusId } });
            toast.success('Status updated', undefined, { id: tid });
        } catch (error) {
            // Revert on error
            setLocalStatusId(currentStatus.id);
            toast.error('Failed to update status', undefined, { id: tid });
        }
    };

    const color = selectedStatus?.color || '#64748b';

    return (
        <div className="h-full w-full flex items-center relative group" onClick={(e) => e.stopPropagation()}>
            <select
                value={localStatusId}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={cn(
                    "w-full h-full px-2 py-0 text-[10px] font-bold tracking-wide uppercase text-center border-0 appearance-none cursor-pointer outline-none transition-all",
                    "hover:brightness-95 focus:ring-inset focus:ring-1 focus:ring-gray-200"
                )}
                style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    textAlignLast: 'center'
                }}
            >
                {allStatuses.length > 0 ? (
                    allStatuses.map((st: any) => (
                        <option key={st.id} value={st.id} className="text-gray-900 bg-white font-medium uppercase text-left">
                            {st.name}
                        </option>
                    ))
                ) : (
                    <option value={currentStatus.id} className="uppercase text-left">{currentStatus.name}</option>
                )}
            </select>
            <div className="absolute right-3 pointer-events-none opacity-80">
                <ChevronDown className="w-3 h-3" style={{ color }} />
            </div>
        </div>
    );
}

export default function TasksPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const { data: tasksData, isLoading, error, refetch } = useMyTasks({ page, limit });
    const tasks = tasksData?.data || [];
    const meta = tasksData?.meta;
    const router = useRouter();

    const hasNextPage = meta ? meta.page < meta.totalPages : false;

    const filteredTasks = useMemo(() => {
        return tasks.filter(
            (task) =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                task.projectName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tasks, searchQuery]);

    // Cell Renderers
    const TaskNameRenderer = (props: ICellRendererParams) => {
        const { title, projectName, projectColor, projectId, id } = props.data as MyTask;
        const initial = title?.charAt(0) || 'T';

        const handleClick = () => {
            router.push(`/projects/${projectId}`);
        };

        return (
            <div
                className="flex items-center gap-3 group cursor-pointer w-full overflow-hidden"
                onClick={handleClick}
            >
                <div
                    className="w-8 h-8 rounded-md shadow-sm flex items-center justify-center text-white font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{
                        backgroundColor: projectColor || 'var(--primary)',
                        background: projectColor ? `linear-gradient(135deg, ${projectColor}, ${projectColor}dd)` : 'var(--primary)',
                    }}
                >
                    {initial}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-1.5 w-full">
                        <span
                            className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-xs block"
                            title={title}
                        >
                            {title}
                        </span>
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border bg-gray-50 text-gray-500 border-gray-100">
                            {projectName}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const ProjectRenderer = (props: ICellRendererParams) => {
        const { projectName, projectColor, projectId } = props.data as MyTask;
        const initial = projectName?.charAt(0) || 'P';

        return (
            <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => router.push(`/projects/${projectId}`)}
            >
                <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
                    style={{
                        backgroundColor: projectColor || '#091590',
                        background: projectColor ? `linear-gradient(135deg, ${projectColor}, ${projectColor}dd)` : undefined,
                    }}
                >
                    {initial}
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-600 truncate text-xs">
                    {projectName}
                </span>
            </div>
        );
    };

    const TagsRenderer = (props: ICellRendererParams) => {
        const tags = (props.value || []) as MyTaskTag[];

        if (tags.length === 0) {
            return <div className="h-full flex items-center text-[10px] text-gray-400 italic">No tags</div>;
        }

        return (
            <div className="h-full flex items-center gap-1 flex-wrap content-center">
                {tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-transparent shadow-sm"
                        style={{
                            backgroundColor: tag.color + '15',
                            color: tag.color,
                            borderColor: tag.color + '30',
                        }}
                    >
                        {tag.name}
                    </span>
                ))}
                {tags.length > 2 && (
                    <span className="text-[10px] items-center flex justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        +{tags.length - 2}
                    </span>
                )}
            </div>
        );
    };

    const StatusRenderer = (props: ICellRendererParams) => {
        const { id: taskId, status, projectId } = props.data as MyTask;
        if (!status) return null;
        return <StatusDropdown taskId={taskId} projectId={projectId} currentStatus={status} />;
    };

    const PriorityRenderer = (props: ICellRendererParams) => {
        const priority = props.value ?? 3;
        const config = PRIORITY_LABELS[priority] || PRIORITY_LABELS[3];

        return (
            <div className="h-full w-full flex items-center">
                <span className={`flex items-center justify-center w-full h-full px-2 text-[10px] font-bold tracking-wide border-0 ${config.color}`}>
                    {config.label}
                </span>
            </div>
        );
    };

    const AssigneesRenderer = (props: ICellRendererParams) => {
        const assignees = props.data?.assignees || [];

        if (assignees.length === 0) {
            return <div className="h-full flex items-center text-[10px] text-gray-400 italic">Unassigned</div>;
        }

        return (
            <div className="h-full flex items-center gap-1">
                {assignees.slice(0, 3).map((a: any) => (
                    <div
                        key={a.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 bg-[#091590] overflow-hidden"
                        title={a.name}
                    >
                        {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                            a.name?.charAt(0) || '?'
                        )}
                    </div>
                ))}
                {assignees.length > 3 && (
                    <span className="text-[10px] text-gray-500 font-medium">+{assignees.length - 3}</span>
                )}
            </div>
        );
    };

    const DateRenderer = (props: ICellRendererParams) => {
        const date = props.value;
        if (!date) return <div className="h-full flex items-center text-gray-300">-</div>;

        const targetDate = new Date(date);
        const formatted = targetDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isPast = diffDays < 0;
        const isNearDue = diffDays >= 0 && diffDays <= 5;

        return (
            <div className="h-full flex items-center gap-2">
                <span
                    className={`text-[11px] font-medium ${props.colDef?.field === 'dueDate' && (isPast || isNearDue) ? 'text-red-500 font-bold' : 'text-gray-600'}`}
                >
                    {formatted}
                    {props.colDef?.field === 'dueDate' && isNearDue && (
                        <span className="text-[10px] ml-1 opacity-90">({diffDays} days)</span>
                    )}
                </span>
            </div>
        );
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            {
                headerName: 'S.No',
                valueGetter: 'node.rowIndex + 1',
                width: 70,
                pinned: 'left',
                cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
                suppressMenu: true,
            },
            {
                field: 'title',
                headerName: 'TASK',
                flex: 2,
                minWidth: 260,
                pinned: 'left',
                cellRenderer: TaskNameRenderer,
            },
            {
                field: 'projectName',
                headerName: 'PROJECT NAME',
                width: 160,
                cellRenderer: ProjectRenderer,
            },
            {
                field: 'tags',
                headerName: 'TAGS',
                flex: 1,
                minWidth: 140,
                cellRenderer: TagsRenderer,
                sortable: false,
            },
            {
                field: 'status',
                headerName: 'STATUS',
                width: 140,
                valueGetter: (params) => params.data?.status?.name,
                cellRenderer: StatusRenderer,
            },
            {
                field: 'priority',
                headerName: 'PRIORITY',
                width: 110,
                cellRenderer: PriorityRenderer,
            },
            {
                field: 'assignees',
                headerName: 'ASSIGNEES',
                width: 120,
                cellRenderer: AssigneesRenderer,
                sortable: false,
            },
            {
                field: 'dueDate',
                headerName: 'DUE',
                width: 120,
                cellRenderer: DateRenderer,
            },
            {
                field: 'createdAt',
                headerName: 'CREATED',
                width: 120,
                cellRenderer: DateRenderer,
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
        }),
        []
    );

    const handleRetry = () => refetch();

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/projects')}
                                className="p-1 -ml-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tasks(Assigned to me)</h1>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                                {meta?.total ?? filteredTasks.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-between sm:justify-end">
                        <div className="relative flex-1 sm:flex-initial sm:max-w-xs w-full lg:max-w-sm group transition-all">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />
                            <div className="flex items-center bg-gray-50 p-0.5 rounded-md border border-gray-200">
                                <div
                                    className="p-1 rounded bg-white text-[var(--primary)] shadow-sm"
                                    title="List View"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-0 bg-white">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
                            <MoreVertical className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-md font-semibold text-gray-900">Error loading tasks</h3>
                        <p className="text-sm text-gray-500">{(error as Error)?.message || 'Unknown error'}</p>
                        <Button variant="primary" size="sm" onClick={handleRetry} className="mt-2">
                            Retry
                        </Button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-hidden ag-theme-alpine custom-ag-grid border-0 w-full pl-0">
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
                                .custom-ag-grid .ag-cell[col-id='status'],
                                .custom-ag-grid .ag-cell[col-id='priority'] {
                                    padding: 0 !important;
                                }
                                .custom-ag-grid .ag-row:hover {
                                    background-color: #f8fafc !important;
                                }
                                .custom-ag-grid .ag-row-selected {
                                    background-color: #eff6ff !important;
                                }
                                .custom-ag-grid .ag-paging-panel {
                                    z-index: 0 !important;
                                    border-top: 1px solid #cbd5e1 !important;
                                }
                            `}</style>
                            <AgGridReact
                                theme="legacy"
                                rowData={filteredTasks}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                getRowId={(params) => params.data.id}
                                rowHeight={48}
                                headerHeight={40}
                                pagination={true}
                                paginationPageSize={limit}
                                suppressPaginationPanel={true}
                                animateRows={true}
                                suppressLoadingOverlay={true}
                            />
                        </div>

                        {/* Custom Pagination Controls */}
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white shrink-0">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing{' '}
                                        <span className="font-medium">
                                            {filteredTasks.length > 0 ? (page - 1) * limit + 1 : 0}
                                        </span>{' '}
                                        to{' '}
                                        <span className="font-medium">
                                            {Math.min(page * limit, meta?.total || 0)}
                                        </span>{' '}
                                        of <span className="font-medium">{meta?.total || 0}</span> results
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-4"
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                        <option value={100}>100 / page</option>
                                    </select>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(1)}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">First</span>
                                            <span aria-hidden="true">&laquo;</span>
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <span aria-hidden="true">&lsaquo;</span>
                                        </button>
                                        <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                            {page}
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={!hasNextPage}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <span aria-hidden="true">&rsaquo;</span>
                                        </button>
                                        <button
                                            onClick={() => setPage(meta?.totalPages || 1)}
                                            disabled={!meta?.totalPages || page === meta?.totalPages}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Last</span>
                                            <span aria-hidden="true">&raquo;</span>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
