'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Bell, Trash2, Loader2, Calendar } from 'lucide-react';
import type { Reminder } from '@/types/reminder';
import { useDeleteReminder } from '@/hooks/use-reminders';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

ModuleRegistry.registerModules([AllCommunityModule]);

interface RemindersListProps {
  reminders: Reminder[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-blue-50 dark:bg-blue-950/60 text-[#091590] dark:text-blue-300 border-blue-100 dark:border-blue-800/60',
  SENT: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

export function RemindersList({
  reminders,
  isLoading,
  total,
  page = 1,
  totalPages = 1,
  onPageChange,
}: RemindersListProps) {
  const deleteReminder = useDeleteReminder();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (reminder: Reminder) => {
      if (!confirm(`Delete reminder "${reminder.title}"?`)) return;
      setDeletingId(reminder.id);
      try {
        await deleteReminder.mutateAsync(reminder.id);
        toast.success('Reminder removed');
      } catch {
        toast.error('Failed to delete reminder');
      } finally {
        setDeletingId(null);
      }
    },
    [deleteReminder, toast],
  );

  const TitleRenderer = (props: ICellRendererParams) => {
    const row = props.data as Reminder;
    if (!row) return null;
    return (
      <div className="flex flex-col justify-center h-full py-0.5 min-w-0">
        <span className="font-semibold text-gray-900 dark:text-slate-100 text-xs truncate leading-tight">
          {row.title}
        </span>
        {row.description ? (
          <span className="text-[10px] text-gray-400 truncate leading-tight">{row.description}</span>
        ) : null}
      </div>
    );
  };

  const StatusRenderer = (props: ICellRendererParams) => {
    const status = (props.value as string) || 'PENDING';
    return (
      <div className="h-full flex items-center">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
            STATUS_STYLE[status] || STATUS_STYLE.PENDING,
          )}
        >
          {status}
        </span>
      </div>
    );
  };

  const DateTimeRenderer = (props: ICellRendererParams) => {
    if (!props.value) {
      return <span className="text-gray-400 text-xs">—</span>;
    }
    try {
      return (
        <div className="h-full flex items-center gap-1.5 text-gray-600 dark:text-slate-300 font-medium text-xs">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="whitespace-nowrap">
            {format(new Date(props.value), 'dd MMM yyyy, hh:mm a')}
          </span>
        </div>
      );
    } catch {
      return <span className="text-xs">{String(props.value)}</span>;
    }
  };

  const LinkRenderer = (props: ICellRendererParams) => {
    const row = props.data as Reminder;
    if (!row) return null;
    const label = row.project?.name || row.task?.title || '—';
    const sub = row.task?.title && row.project?.name ? row.task.title : null;
    return (
      <div className="flex flex-col justify-center h-full min-w-0">
        <span className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">{label}</span>
        {sub ? <span className="text-[10px] text-gray-400 truncate">{sub}</span> : null}
      </div>
    );
  };

  const AssigneesRenderer = (props: ICellRendererParams) => {
    const row = props.data as Reminder;
    const assignees = row?.assignees || [];
    if (!assignees.length) return <span className="text-gray-400 text-xs">—</span>;
    return (
      <div className="h-full flex items-center gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#091590] dark:text-blue-300 border border-blue-100 dark:border-blue-900">
          {assignees.length} user{assignees.length !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  const ActionsRenderer = (props: ICellRendererParams) => {
    const row = props.data as Reminder;
    if (!row) return null;
    const busy = deletingId === row.id;
    return (
      <div className="h-full flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => handleDelete(row)}
          disabled={busy}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-30"
          title="Delete"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: 'S.NO',
        valueGetter: 'node.rowIndex + 1',
        width: 70,
        pinned: 'left',
        cellClass: 'text-gray-500 font-medium text-[11px] flex items-center justify-center',
        suppressMenu: true,
      },
      {
        field: 'title',
        headerName: 'REMINDER',
        flex: 2,
        minWidth: 220,
        cellRenderer: TitleRenderer,
      },
      {
        field: 'remindAt',
        headerName: 'REMIND AT',
        width: 190,
        cellRenderer: DateTimeRenderer,
      },
      {
        field: 'status',
        headerName: 'STATUS',
        width: 130,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: 'PROJECT / TASK',
        flex: 1.2,
        minWidth: 180,
        cellRenderer: LinkRenderer,
        sortable: false,
      },
      {
        headerName: 'ASSIGNEES',
        width: 120,
        cellRenderer: AssigneesRenderer,
        sortable: false,
      },
      {
        field: 'createdAt',
        headerName: 'CREATED',
        width: 170,
        cellRenderer: DateTimeRenderer,
      },
      {
        headerName: 'ACTIONS',
        width: 90,
        pinned: 'right',
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
      },
    ],
    [deletingId, handleDelete],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      headerClass:
        'bg-gray-50 dark:bg-slate-900 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider',
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="w-7 h-7 text-[#091590] animate-spin" />
        <span className="text-xs font-semibold text-gray-400">Loading reminders...</span>
      </div>
    );
  }

  if (!reminders.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--primary)] flex items-center justify-center mb-3">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">No Reminders Found</h3>
        <p className="text-xs text-gray-500 max-w-sm">Create a reminder to get an in-app notify at the set time.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden ag-theme-alpine custom-ag-grid border-0 w-full pl-0">
        <style jsx global>{`
          .custom-ag-grid .ag-root-wrapper {
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            background-color: white;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          }
          .custom-ag-grid .ag-header,
          .custom-ag-grid .ag-header-row,
          .custom-ag-grid .ag-header-cell,
          .custom-ag-grid .ag-pinned-left-header,
          .custom-ag-grid .ag-pinned-right-header {
            background-color: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .custom-ag-grid .ag-header-cell-label,
          .custom-ag-grid .ag-header-cell-text {
            color: #64748b !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .custom-ag-grid .ag-row {
            border-bottom: 1px solid #f1f5f9 !important;
            background-color: white !important;
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
          .custom-ag-grid .ag-row:hover {
            background-color: #f8fafc !important;
          }
          .custom-ag-grid .ag-paging-panel {
            display: none !important;
          }
          .dark .custom-ag-grid .ag-root-wrapper {
            border: 1px solid #334155 !important;
            background-color: #0f172a !important;
            box-shadow: none !important;
          }
          .dark .custom-ag-grid .ag-header,
          .dark .custom-ag-grid .ag-header-row,
          .dark .custom-ag-grid .ag-header-cell,
          .dark .custom-ag-grid .ag-pinned-left-header,
          .dark .custom-ag-grid .ag-pinned-right-header {
            background-color: #1e293b !important;
            border-bottom: 1px solid #334155 !important;
          }
          .dark .custom-ag-grid .ag-header-cell-label,
          .dark .custom-ag-grid .ag-header-cell-text {
            color: #94a3b8 !important;
          }
          .dark .custom-ag-grid .ag-row {
            border-bottom: 1px solid #1e293b !important;
            background-color: #0f172a !important;
          }
          .dark .custom-ag-grid .ag-cell {
            color: #f1f5f9 !important;
          }
          .dark .custom-ag-grid .ag-row:hover {
            background-color: #1e293b !important;
          }
        `}</style>
        <AgGridReact
          theme="legacy"
          rowData={reminders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={36}
          headerHeight={30}
          animateRows={true}
          suppressLoadingOverlay={true}
          suppressPaginationPanel={true}
          getRowId={(p) => p.data.id}
        />
      </div>

      {(total != null || onPageChange) && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-800 px-4 py-2 bg-white dark:bg-slate-900 shrink-0">
          <p className="text-xs text-gray-700 dark:text-slate-300">
            Showing{' '}
            <span className="font-medium text-gray-900 dark:text-slate-100">{reminders.length}</span>
            {total != null ? (
              <>
                {' '}
                of <span className="font-medium text-gray-900 dark:text-slate-100">{total}</span> results
              </>
            ) : null}
          </p>
          {onPageChange && totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="px-2.5 py-1 text-xs border border-gray-200 dark:border-slate-700 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="px-2.5 py-1 text-xs border border-gray-200 dark:border-slate-700 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
