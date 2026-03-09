'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Clock, Users, ArrowLeft, Search } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { ProjectSearchBox } from '@/components/projects/ProjectSearchBox';

// Register AG-Grid modules (Required for v32+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Ag-Grid Styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Define the Mock Data for Frontend Table
const MOCK_DATA = [
    {
        id: "1",
        startedAt: "2026-03-02T09:00:00Z",
        endedAt: "2026-03-02T17:00:00Z",
        durationMinutes: 480,
        timesheetStatus: 'APPROVED',
        approvedBy: 'System Admin',
        description: 'Working on Project Management Dashboard implementation'
    },
    {
        id: "2",
        startedAt: "2026-03-03T09:30:00Z",
        endedAt: "2026-03-03T18:00:00Z",
        durationMinutes: 510,
        timesheetStatus: 'SUBMITTED',
        approvedBy: '-',
        description: 'Fixed bugs in Ag-Grid table styling'
    },
    {
        id: "3",
        startedAt: "2026-03-04T10:00:00Z",
        endedAt: "2026-03-04T16:00:00Z",
        durationMinutes: 360,
        timesheetStatus: 'DRAFT',
        approvedBy: '-',
        description: 'Meetings with the design team and documentation'
    },
    {
        id: "4",
        startedAt: "2026-03-05T09:00:00Z",
        endedAt: "2026-03-05T17:30:00Z",
        durationMinutes: 510,
        timesheetStatus: 'APPROVED',
        approvedBy: 'Regional Admin',
        description: 'Initial setup of and research for the timesheet component'
    },
    {
        id: "5",
        startedAt: "2026-03-06T08:30:00Z",
        endedAt: "2026-03-06T17:00:00Z",
        durationMinutes: 510,
        timesheetStatus: 'SUBMITTED',
        approvedBy: '-',
        description: 'Backend integration for the project management dashboards'
    }
];

const TAB_ITEMS: TabItem[] = [
    { id: 'my', label: 'My Timesheet', icon: <Clock className="w-4 h-4" /> },
    { id: 'team', label: 'Team Timesheets', icon: <Users className="w-4 h-4" /> },
];

export default function TimesheetPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('my');
    const [searchQuery, setSearchQuery] = useState('');
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(1);

    const allRowData = useMemo(() => {
        return MOCK_DATA.filter(row =>
            row.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const StatusRenderer = (props: ICellRendererParams) => {
        const status = props.value;
        const color =
            status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-gray-100 text-gray-700 border-gray-200';

        return (
            <div className="h-full w-full flex items-center">
                <span className={cn(
                    "flex items-center justify-center w-full h-full px-3 text-[10px] font-bold tracking-wide border-0",
                    color
                )}>
                    {status}
                </span>
            </div>
        );
    };

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: 'id (SI.NO)',
            valueGetter: "node.rowIndex + 1",
            width: 90,
            pinned: 'left',
            cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
            suppressMenu: true,
        },
        {
            field: 'startedAt',
            headerName: 'Week days',
            flex: 1,
            minWidth: 150,
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.value) return '-';
                return new Date(params.value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            },
        },
        {
            field: 'endedAt',
            headerName: 'Week Ends',
            flex: 1,
            minWidth: 150,
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.value) return '-';
                return new Date(params.value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            },
        },
        {
            field: 'durationMinutes',
            headerName: 'Number MIn',
            width: 120,
            cellClass: 'text-gray-900 font-mono text-[11px] flex items-center justify-center',
        },
        {
            field: 'timesheetStatus',
            headerName: 'Status',
            width: 130,
            cellRenderer: StatusRenderer,
        },
        {
            field: 'approvedBy',
            headerName: 'Approved BY',
            flex: 1,
            minWidth: 150,
            cellClass: 'text-gray-600 font-medium text-[11px] flex items-center px-4',
        },
        {
            field: 'description',
            headerName: 'Reason',
            flex: 2,
            minWidth: 200,
            cellClass: 'text-gray-600 text-[11px] flex items-center px-4',
        }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
    }), []);

    return (
        <div className="flex flex-col bg-white -m-4 lg:-m-6 h-[calc(100vh-64px)] overflow-hidden">
            <style jsx global>{`
                .custom-ag-grid .ag-root-wrapper {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    background-color: white !important;
                    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                    min-height: 400px;
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
                .custom-ag-grid .ag-cell[col-id="timesheetStatus"] {
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

            <div className="sticky top-0 z-20 bg-white">
                {/* Premium Header (following Project Details) */}
                <div className="bg-white border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <button
                                onClick={() => router.back()}
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 bg-[#091590]"
                                >
                                    <Clock className="w-4 h-4" />
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-base font-bold text-gray-900 leading-none truncate" title="Timesheet">Timesheet</h1>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 py-0.5 rounded border border-gray-100 flex-shrink-0">
                                                {allRowData.length} records
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Desktop Search */}
                            <div className="hidden sm:block">
                                <ProjectSearchBox
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search reason..."
                                />
                            </div>

                            {/* Mobile Search */}
                            <div className="flex items-center gap-2 sm:hidden w-full">
                                <ProjectSearchBox
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Row Row (following Project Details) */}
                <div className="bg-white border-b border-gray-200 px-3 sm:px-4 flex items-center justify-between gap-4 w-full">
                    <Tabs
                        items={TAB_ITEMS}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="border-none flex-1 min-w-0 -ml-2 sm:ml-0 overflow-x-auto no-scrollbar"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-0 bg-white">
                <div className="h-full flex flex-col ag-theme-alpine custom-ag-grid">
                    <div className="flex-1 overflow-hidden w-full pl-0">
                        <AgGridReact
                            theme="legacy"
                            rowData={allRowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            rowHeight={48}
                            headerHeight={40}
                            pagination={true}
                            paginationPageSize={limit}
                            suppressPaginationPanel={true}
                            animateRows={true}
                            suppressLoadingOverlay={true}
                        />
                    </div>

                    {/* Custom Pagination Controls (Matching Tasks Page) */}
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white shrink-0">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 h-8 text-xs rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <button
                                className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 h-8 text-xs rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(allRowData.length / limit)}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {allRowData.length > 0 ? (page - 1) * limit + 1 : 0}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(page * limit, allRowData.length)}
                                    </span>{' '}
                                    of <span className="font-medium">{allRowData.length}</span> results
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-4 py-1"
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
                                        disabled={page >= Math.ceil(allRowData.length / limit)}
                                        className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <span aria-hidden="true">&rsaquo;</span>
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.ceil(allRowData.length / limit) || 1)}
                                        disabled={!allRowData.length || page === Math.ceil(allRowData.length / limit)}
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
            </div>
        </div>
    );
}
