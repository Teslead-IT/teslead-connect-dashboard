'use client';

import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Plus, Search, ChevronDown, List as ListIcon, LayoutGrid } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import { useProjectIssues, useCreateIssue, useUpdateIssue } from '@/hooks/use-issues';
import { useProjectWorkflow, useProjectTasks } from '@/hooks/use-tasks';
import { useStructuredPhases } from '@/hooks/use-phases';
import { useProjectMembers } from '@/hooks/use-projects';
import { CreateIssueModal } from './CreateIssueModal';
import { IssueViewModal } from './IssueViewModal';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDate } from '@/lib/utils';
import type { Issue } from '@/types/issue';

interface IssuesTabProps {
    projectId: string;
    canCreateIssue?: boolean;
}

function IssueStatusDropdown({
    issueId,
    projectId,
    currentStatus,
    onInteraction,
}: {
    issueId: string;
    projectId: string;
    currentStatus: any;
    onInteraction?: () => void;
}) {
    const { data: workflow = [] } = useProjectWorkflow(projectId);
    const updateIssueMutation = useUpdateIssue(projectId);
    const toast = useToast();
    const [localStatusId, setLocalStatusId] = useState(currentStatus.id);

    const allStatuses = useMemo(() =>
        workflow.flatMap((stage: any) => (stage.statuses || []).map((st: any) => ({ ...st, stageName: stage.name }))),
        [workflow]
    );

    const selectedStatus = useMemo(() => {
        if (localStatusId === currentStatus.id) return currentStatus;
        return allStatuses.find(s => s.id === localStatusId) || currentStatus;
    }, [localStatusId, currentStatus, allStatuses]);

    const handleStatusChange = async (newStatusId: string) => {
        if (newStatusId === localStatusId) return;
        onInteraction?.();
        setLocalStatusId(newStatusId);
        try {
            await updateIssueMutation.mutateAsync({ issueId, data: { statusId: newStatusId } });
            toast.success('Issue status updated');
        } catch (error) {
            setLocalStatusId(currentStatus.id);
            toast.error('Failed to update status');
        }
    };

    const color = selectedStatus?.color || '#ef4444';

    return (
        <div
            className="h-full w-full flex items-center relative"
            onClick={(e) => {
                e.stopPropagation();
                onInteraction?.();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onInteraction?.();
            }}
        >
            <select
                value={localStatusId}
                onChange={(e) => {
                    onInteraction?.();
                    handleStatusChange(e.target.value);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onInteraction?.();
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onInteraction?.();
                }}
                onFocus={() => {
                    onInteraction?.();
                }}
                className="w-full h-full px-2 text-[10px] font-bold tracking-wide uppercase text-center border-0 appearance-none cursor-pointer outline-none transition-all hover:brightness-95"
                style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    textAlignLast: 'center',
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
            <div className="absolute right-2 pointer-events-none opacity-80">
                <ChevronDown className="w-3 h-3" style={{ color }} />
            </div>
        </div>
    );
}

export function IssuesTab({ projectId, canCreateIssue = true }: IssuesTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const lastStatusInteractionRef = React.useRef<number>(0);

    const markStatusInteraction = React.useCallback(() => {
        lastStatusInteractionRef.current = Date.now();
    }, []);

    const { data: issues = [], isLoading } = useProjectIssues(projectId);
    const { data: workflow = [] } = useProjectWorkflow(projectId);
    const { data: phases = [] } = useStructuredPhases(projectId);
    const { data: members = [] } = useProjectMembers(projectId);
    const { data: tasks = [] } = useProjectTasks(projectId);

    const createIssueMutation = useCreateIssue(projectId);

    const filteredIssues = useMemo(() => {
        if (!searchQuery.trim()) return issues;
        const q = searchQuery.toLowerCase();
        return issues.filter(issue =>
            issue.title.toLowerCase().includes(q) ||
            issue.issueId?.toLowerCase().includes(q) ||
            issue.description?.toLowerCase().includes(q)
        );
    }, [issues, searchQuery]);

    const IssueTitleRenderer = (props: ICellRendererParams<Issue>) => {
        const issue = props.data;
        if (!issue) return null;
        const title = issue.title || '';
        const initial = title.charAt(0).toUpperCase() || 'I';
        const projectColor = issue.projectColor || '#3b82f6';

        return (
            <div className="flex items-center gap-3 group cursor-pointer w-full overflow-hidden">
                <div
                    className="w-6 h-6 rounded-md shadow-xs flex items-center justify-center text-white font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{
                        backgroundColor: projectColor,
                        background: `linear-gradient(135deg, ${projectColor}, ${projectColor}dd)`
                    }}
                >
                    {initial}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-xs block" title={title}>
                        {title}
                    </span>
                </div>
            </div>
        );
    };

    const AccessRenderer = (props: ICellRendererParams<Issue>) => {
        const sev = props.data?.severity || 'MEDIUM';
        return (
            <div className="h-full w-full flex items-center">
                <span className="flex items-center justify-center w-full h-full px-2 text-[10px] font-bold tracking-wide uppercase bg-slate-50 text-slate-500 border-l border-r border-slate-100">
                    {sev}
                </span>
            </div>
        );
    };

    const RoleRenderer = (props: ICellRendererParams<Issue>) => {
        const prioMap: Record<number, string> = { 1: 'P1-LOWEST', 2: 'P2-LOW', 3: 'MEDIUM', 4: 'HIGH', 5: 'CRITICAL' };
        const prioLabel = prioMap[props.data?.priority || 3] || 'MEDIUM';
        return (
            <div className="h-full w-full flex items-center">
                <span className="flex items-center justify-center w-full h-full px-2 text-[10px] font-bold tracking-wide uppercase bg-purple-50 text-purple-600 border-l border-r border-purple-100">
                    {prioLabel}
                </span>
            </div>
        );
    };

    const AssigneesRenderer = (props: ICellRendererParams<Issue>) => {
        const assignees = props.data?.assignees || [];

        if (assignees.length === 0) {
            return <div className="h-full flex items-center text-[10px] text-gray-400 italic">Unassigned</div>;
        }

        return (
            <div className="h-full flex items-center gap-1">
                {assignees.slice(0, 3).map((a: any) => (
                    <div
                        key={a.id || a.userId || a.email}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 bg-[#091590] overflow-hidden shadow-xs"
                        title={a.name || a.email}
                    >
                        {a.avatarUrl ? (
                            <img src={a.avatarUrl} alt={a.name || a.email} className="w-full h-full object-cover" />
                        ) : (
                            (a.name || a.email || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                ))}
                {assignees.length > 3 && (
                    <span className="text-[10px] text-gray-500 font-medium">+{assignees.length - 3}</span>
                )}
            </div>
        );
    };

    const TagsRenderer = (props: ICellRendererParams<Issue>) => {
        const type = props.data?.type || 'BUG';
        return (
            <div className="h-full flex items-center">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-50 text-emerald-600 border-emerald-100 shadow-2xs uppercase">
                    {type}
                </span>
            </div>
        );
    };

    const PhaseRenderer = (props: ICellRendererParams<Issue>) => {
        const phaseName = props.data?.phaseName;
        if (!phaseName) return <div className="h-full flex items-center text-gray-300 text-xs">-</div>;

        return (
            <div className="h-full flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tight">
                    {phaseName}
                </span>
            </div>
        );
    };

    const DateRenderer = (props: ICellRendererParams) => {
        const date = props.value;
        if (!date) return <div className="h-full flex items-center text-gray-300 text-xs">-</div>;

        const formatted = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return (
            <div className="h-full flex items-center gap-2">
                <span className="text-[11px] font-medium text-gray-600">
                    {formatted}
                </span>
            </div>
        );
    };

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: 'S.No',
            valueGetter: "node.rowIndex + 1",
            width: 70,
            pinned: 'left',
            cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
            suppressMenu: true,
        },
        {
            field: 'issueId',
            headerName: 'ISSUE ID',
            width: 120,
            pinned: 'left',
            cellClass: 'text-gray-400 font-mono text-[10px]',
        },
        {
            field: 'title',
            headerName: 'ISSUE',
            flex: 2,
            minWidth: 240,
            cellRenderer: IssueTitleRenderer,
        },
        {
            field: 'type',
            headerName: 'TYPE',
            width: 120,
            cellRenderer: TagsRenderer,
            sortable: false,
        },
        {
            field: 'phaseName',
            headerName: 'PHASE',
            width: 140,
            cellRenderer: PhaseRenderer,
        },
        /*{
            field: 'severity',
            headerName: 'SEVERITY',
            width: 110,
            cellRenderer: AccessRenderer,
        },*/
        {
            field: 'status',
            headerName: 'STATUS',
            width: 140,
            cellRenderer: (params: ICellRendererParams<Issue>) => {
                if (!params.data || !params.data.status) return null;
                return (
                    <IssueStatusDropdown
                        issueId={params.data.id}
                        projectId={projectId}
                        currentStatus={params.data.status}
                        onInteraction={markStatusInteraction}
                    />
                );
            },
        },
        {
            field: 'priority',
            headerName: 'PRIORITY',
            width: 100,
            cellRenderer: RoleRenderer,
        },
        {
            field: 'assignees',
            headerName: 'ASSIGNEES',
            width: 130,
            cellRenderer: AssigneesRenderer,
            sortable: false,
        },
        {
            field: 'createdAt',
            headerName: 'CREATED',
            width: 120,
            cellRenderer: DateRenderer,
        },
        {
            field: 'dueDate',
            headerName: 'DUE',
            width: 120,
            cellRenderer: DateRenderer,
        },
    ], [projectId, markStatusInteraction]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
    }), []);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Toolbar */}
            <div className="border-b border-gray-100 py-1 shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Issues</h1>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                                {filteredIssues.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-between sm:justify-end">
                        <div className="relative flex-1 sm:flex-initial sm:max-w-xs w-full lg:max-w-sm group transition-all">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                            {/* <div className="flex items-center bg-gray-50 p-0.5 rounded-md border border-gray-200">
                                <button className="p-1 rounded bg-white text-blue-600 shadow-xs" title="List View">
                                    <ListIcon className="w-4 h-4" />
                                </button>
                                <button className="p-1 rounded text-gray-400 hover:text-gray-600" title="Kanban View">
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div> */}

                            {canCreateIssue && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center justify-center bg-[#091590] text-white hover:bg-[#121033] font-medium px-4 h-8 text-xs rounded-md ml-1 sm:ml-2 transition-colors duration-200 border border-transparent shadow-xs whitespace-nowrap"
                                >
                                    <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Report Issue</span>
                                    <span className="sm:hidden">Report</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden bg-white flex flex-col justify-between">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader />
                    </div>
                ) : (
                    <div className="h-full flex flex-col justify-between">
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
                                    min-height: 30px !important;
                                }
                                .custom-ag-grid .ag-header-row {
                                    height: 30px !important;
                                }
                                .custom-ag-grid .ag-header-cell {
                                    padding-left: 4px;
                                    padding-right: 4px;
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
                                    padding-left: 8px;
                                    padding-right: 8px;
                                    display: flex;
                                    align-items: center;
                                    color: #0f172a;
                                    font-size: 12px;
                                    font-weight: 500;
                                }
                                .custom-ag-grid .ag-cell[col-id="status"],
                                .custom-ag-grid .ag-cell[col-id="access"],
                                .custom-ag-grid .ag-cell[col-id="role"] {
                                    padding: 0 !important;
                                }
                                .custom-ag-grid .ag-row:hover {
                                    background-color: #f8fafc !important;
                                }
                                .custom-ag-grid .ag-row-selected {
                                    background-color: #eff6ff !important;
                                }
                            `}</style>
                            <AgGridReact
                                theme="legacy"
                                rowData={filteredIssues}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                rowHeight={32}
                                headerHeight={30}
                                pagination={true}
                                paginationPageSize={limit}
                                suppressPaginationPanel={true}
                                animateRows={true}
                                onRowClicked={(event) => {
                                    if (Date.now() - lastStatusInteractionRef.current < 1000) return;
                                    if ((event as any).colDef?.field === 'status' || (event as any).column?.getColId?.() === 'status') return;
                                    if ((event.event?.target as HTMLElement)?.closest?.('select') || (event.event?.target as HTMLElement)?.closest?.('[col-id="status"]')) return;
                                    if (event.data) {
                                        setSelectedIssueId(event.data.id);
                                    }
                                }}
                            />
                        </div>

                        {/* Custom Footer Pagination Controls */}
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 bg-white shrink-0 mt-2">
                            <div className="flex items-center">
                                <p className="text-xs text-gray-700">
                                    Showing <span className="font-medium">{filteredIssues.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium">{Math.min(page * limit, filteredIssues.length)}</span> of <span className="font-medium">{filteredIssues.length}</span> results
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    className="text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1 bg-white border"
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
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-2xs" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-1 text-xs text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &laquo;
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-1 text-xs text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &lsaquo;
                                    </button>
                                    <button className="relative inline-flex items-center px-3 py-1 text-xs font-bold text-gray-900 border border-gray-300 bg-gray-50">
                                        {page}
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page * limit >= filteredIssues.length}
                                        className="relative inline-flex items-center px-2 py-1 text-xs text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &rsaquo;
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.ceil(filteredIssues.length / limit) || 1)}
                                        disabled={page * limit >= filteredIssues.length}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-1 text-xs text-gray-500 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &raquo;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Issue Modal */}
            <CreateIssueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={async (data) => {
                    await createIssueMutation.mutateAsync(data);
                }}
                workflow={workflow}
                tasks={tasks}
                members={members}
                phases={phases}
                projectId={projectId}
            />

            {/* View/Edit Issue Drawer Modal */}
            <IssueViewModal
                issueId={selectedIssueId}
                projectId={projectId}
                isOpen={!!selectedIssueId}
                onClose={() => setSelectedIssueId(null)}
                workflow={workflow}
                members={members}
                tasks={tasks}
                phases={phases}
            />
        </div>
    );
}

