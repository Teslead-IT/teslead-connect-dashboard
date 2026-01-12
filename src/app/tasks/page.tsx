'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { mockTasks, type Task } from '@/mock/tasks';
import { mockProjects } from '@/mock/projects';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Plus, Settings, Download } from 'lucide-react';
import {
    StatusCellRenderer,
    PriorityCellRenderer,
    AssigneeCellRenderer,
    DateCellRenderer,
} from '@/components/tables/CellRenderers';
import { defaultGridOptions, applyColumnState, onColumnStateChanged } from '@/lib/ag-grid';

export default function TasksPage() {
    const gridRef = useRef<AgGridReact<Task>>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDrawer, setShowTaskDrawer] = useState(false);

    const columnDefs: ColDef<Task>[] = [
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 45,
            pinned: 'left',
            lockPosition: true,
        },
        {
            field: 'id',
            headerName: 'ID',
            width: 100,
            pinned: 'left',
        },
        {
            field: 'title',
            headerName: 'Task Name',
            flex: 2,
            minWidth: 200,
            pinned: 'left',
            cellStyle: { fontWeight: 500 },
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            cellRenderer: StatusCellRenderer,
            filter: false,
            checkboxSelection: false,
            headerCheckboxSelection: false,
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 130,
            cellRenderer: PriorityCellRenderer,
        },
        {
            field: 'assigneeId',
            headerName: 'Assignee',
            width: 180,
            cellRenderer: AssigneeCellRenderer,
        },
        {
            field: 'projectId',
            headerName: 'Project',
            width: 200,
            valueGetter: (params) => {
                const project = mockProjects.find((p) => p.id === params.data?.projectId);
                return project?.name || '-';
            },
        },
        {
            field: 'startDate',
            headerName: 'Start Date',
            width: 130,
            cellRenderer: DateCellRenderer,
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 130,
            cellRenderer: DateCellRenderer,
        },
        {
            field: 'estimatedHours',
            headerName: 'Est. Hours',
            width: 120,
            valueFormatter: (params) => (params.value ? `${params.value}h` : '-'),
        },
        {
            field: 'actualHours',
            headerName: 'Actual Hours',
            width: 130,
            valueFormatter: (params) => (params.value ? `${params.value}h` : '-'),
        },
    ];

    const onGridReady = useCallback(() => {
        applyColumnState(gridRef.current?.api, 'tasks-grid');
    }, []);

    const onColumnMoved = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, 'tasks-grid');
    }, []);

    const onColumnResized = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, 'tasks-grid');
    }, []);

    const onColumnVisible = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, 'tasks-grid');
    }, []);

    const onRowClicked = useCallback((event: any) => {
        setSelectedTask(event.data);
        setShowTaskDrawer(true);
    }, []);

    const onExport = useCallback(() => {
        gridRef.current?.api?.exportDataAsCsv();
    }, []);

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            Tasks
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            View and manage all tasks across projects
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={onExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* AG Grid */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
                    <div className="ag-theme-custom ag-theme-quartz-dark" style={{ height: '600px', width: '100%' }}>
                        <AgGridReact<Task>
                            ref={gridRef}
                            rowData={mockTasks}
                            columnDefs={columnDefs}
                            {...defaultGridOptions}
                            onGridReady={onGridReady}
                            onColumnMoved={onColumnMoved}
                            onColumnResized={onColumnResized}
                            onColumnVisible={onColumnVisible}
                            onRowClicked={onRowClicked}
                            rowSelection="multiple"
                            suppressRowClickSelection={false}
                        />
                    </div>
                </div>
            </div>

            {/* Task Details Drawer */}
            <Drawer
                isOpen={showTaskDrawer}
                onClose={() => setShowTaskDrawer(false)}
                title="Task Details"
                size="lg"
            >
                {selectedTask && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                {selectedTask.title}
                            </h3>
                            <p className="text-[var(--color-text-secondary)]">
                                {selectedTask.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Status
                                </label>
                                <div className="mt-1">
                                    <StatusCellRenderer value={selectedTask.status} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Priority
                                </label>
                                <div className="mt-1">
                                    <PriorityCellRenderer value={selectedTask.priority} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Start Date
                                </label>
                                <DateCellRenderer value={selectedTask.startDate} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Due Date
                                </label>
                                <DateCellRenderer value={selectedTask.dueDate} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Assignee
                            </label>
                            <AssigneeCellRenderer value={selectedTask.assigneeId} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Comments
                            </label>
                            <div className="text-sm text-[var(--color-text-tertiary)]">
                                No comments yet
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1">
                                Edit
                            </Button>
                            <Button variant="danger" className="flex-1">
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </>
    );
}
