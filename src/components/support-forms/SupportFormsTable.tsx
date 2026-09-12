'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
    Eye,
    Edit3,
    Trash2,
    Calendar,
    FileCheck,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { useSupportForms, useDeleteSupportForm, SupportForm } from '@/hooks/use-support-forms';

// Register AG-Grid community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface SupportFormsTableProps {
    forms?: SupportForm[];
    isLoading?: boolean;
    total?: number;
    totalPages?: number;
    page?: number;
    setPage?: (page: number | ((prev: number) => number)) => void;
    search?: string;
    onView: (form: SupportForm) => void;
    onEdit: (form: SupportForm) => void;
}

export const SupportFormsTable: React.FC<SupportFormsTableProps> = ({
    forms: propForms,
    isLoading: propIsLoading,
    total: propTotal,
    totalPages: propTotalPages,
    page: propPage,
    setPage: propSetPage,
    search: propSearch,
    onView,
    onEdit,
}) => {
    const [internalSearch] = useState('');
    const [internalPage, setInternalPage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isControlled = propForms !== undefined;

    const page = isControlled ? (propPage ?? 1) : internalPage;
    const setPage = isControlled ? (propSetPage ?? setInternalPage) : setInternalPage;
    const search = isControlled ? (propSearch ?? '') : internalSearch;

    const { data: internalFormsResponse, isLoading: internalIsLoading } = useSupportForms({
        page: internalPage,
        limit: 20,
        search: internalSearch.trim() || undefined,
    });

    const deleteMutation = useDeleteSupportForm();

    const forms = isControlled ? propForms! : (internalFormsResponse?.data || []);
    const isLoading = isControlled ? (propIsLoading ?? false) : internalIsLoading;
    const total = isControlled ? (propTotal ?? 0) : (internalFormsResponse?.total || 0);
    const totalPages = isControlled ? (propTotalPages ?? 1) : (internalFormsResponse?.totalPages || 1);

    const handleDelete = useCallback(async (form: SupportForm) => {
        if (confirm(`Are you sure you want to soft delete the support form for "${form.projectName}"?`)) {
            setDeletingId(form.id);
            try {
                await deleteMutation.mutateAsync(form.id);
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete support form');
            } finally {
                setDeletingId(null);
            }
        }
    }, [deleteMutation]);

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            return format(new Date(dateStr), 'dd MMM yyyy');
        } catch {
            return dateStr;
        }
    };

    // AG-Grid Cell Renderers
    const ProjectNameRenderer = (props: ICellRendererParams) => {
        const form = props.data as SupportForm;
        if (!form) return null;
        return (
            <div className="flex flex-col justify-center h-full cursor-pointer py-1">
                <span className="font-bold text-gray-900 hover:text-[#091590] transition-colors leading-tight">
                    {form.projectName}
                </span>
                {form.project?.name && (
                    <span className="text-[10px] font-semibold text-gray-400 leading-tight">
                        Linked: {form.project.name}
                    </span>
                )}
            </div>
        );
    };

    const DateRenderer = (props: ICellRendererParams) => {
        const dateStr = props.value;
        return (
            <div className="h-full flex items-center gap-1.5 text-gray-600 font-medium">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{formatDate(dateStr)}</span>
            </div>
        );
    };

    const SupportItemsRenderer = (props: ICellRendererParams) => {
        const items = props.value || [];
        return (
            <div className="h-full flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#091590] border border-blue-100">
                    {items.length} Task{items.length !== 1 ? 's' : ''}
                </span>
            </div>
        );
    };

    const ActionsRenderer = (props: ICellRendererParams) => {
        const form = props.data as SupportForm;
        if (!form) return null;
        const isDeletingThis = deletingId === form.id;

        return (
            <div className="h-full flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onView(form)}
                    className="p-1.5 text-gray-500 hover:text-[#091590] hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Form"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onEdit(form)}
                    className="p-1.5 text-gray-500 hover:text-[#091590] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Form"
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDelete(form)}
                    disabled={isDeletingThis}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    title="Soft Delete Form"
                >
                    {isDeletingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </button>
            </div>
        );
    };

    const columnDefs: ColDef[] = useMemo(() => [
        {
            headerName: 'S.NO',
            valueGetter: "node.rowIndex + 1",
            width: 70,
            pinned: 'left',
            cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
            suppressMenu: true,
        },
        {
            field: 'projectName',
            headerName: 'PROJECT NAME',
            flex: 2,
            minWidth: 220,
            cellRenderer: ProjectNameRenderer,
        },
        {
            field: 'projectStartDate',
            headerName: 'START DATE',
            width: 140,
            cellRenderer: DateRenderer,
        },
        {
            field: 'projectCompletionDate',
            headerName: 'COMPLETION DATE',
            width: 150,
            cellRenderer: DateRenderer,
        },
        {
            field: 'items',
            headerName: 'SUPPORT ITEMS',
            width: 140,
            cellRenderer: SupportItemsRenderer,
        },
        {
            field: 'createdAt',
            headerName: 'CREATED AT',
            width: 140,
            cellRenderer: DateRenderer,
        },
        {
            headerName: 'ACTIONS',
            width: 120,
            pinned: 'right',
            cellRenderer: ActionsRenderer,
            sortable: false,
            filter: false,
        },
    ], [deletingId, handleDelete]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
    }), []);

    const onRowClicked = useCallback((event: any) => {
        if (event.data) {
            onView(event.data);
        }
    }, [onView]);

    return (
        <div className="flex flex-col h-full space-y-3">
            {/* AG Grid Table Container */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-2">
                        <Loader2 className="w-7 h-7 text-[#091590] animate-spin" />
                        <span className="text-xs font-semibold text-gray-400">Loading support forms...</span>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#091590] flex items-center justify-center mb-3">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">No Support Forms Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mb-4">
                            {search
                                ? 'No support forms match your current search criteria.'
                                : 'Create your first Online/Onsite Support Form.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden ag-theme-alpine custom-ag-grid border-0 w-full">
                        <style jsx global>{`
                            .custom-ag-grid .ag-root-wrapper {
                                border: none !important;
                                background-color: white;
                            }
                            .custom-ag-grid .ag-header {
                                background-color: #f8fafc !important;
                                border-bottom: 1px solid #e2e8f0 !important;
                                min-height: 32px !important;
                            }
                            .custom-ag-grid .ag-header-row {
                                height: 32px !important;
                            }
                            .custom-ag-grid .ag-header-cell {
                                padding-left: 8px;
                                padding-right: 8px;
                            }
                            .custom-ag-grid .ag-header-cell-label {
                                font-weight: 700;
                                color: #475569 !important;
                                font-size: 11px;
                                letter-spacing: 0.05em;
                                text-transform: uppercase;
                            }
                            .custom-ag-grid .ag-row {
                                border-bottom: 1px solid #f1f5f9;
                                background-color: #ffffff;
                            }
                            .custom-ag-grid .ag-cell {
                                padding-left: 10px;
                                padding-right: 10px;
                                display: flex;
                                items-center: center;
                                color: #0f172a;
                                font-size: 12px;
                                font-weight: 500;
                            }
                            .custom-ag-grid .ag-row:hover {
                                background-color: #eff6ff !important;
                                cursor: pointer;
                            }
                        `}</style>
                        <AgGridReact
                            theme="legacy"
                            rowData={forms}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onRowClicked={onRowClicked}
                            rowHeight={38}
                            headerHeight={32}
                            animateRows={true}
                            suppressCellFocus={true}
                        />
                    </div>
                )}

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                        <span className="text-xs text-gray-500 font-medium">
                            Page {page} of {totalPages} ({total} forms total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
