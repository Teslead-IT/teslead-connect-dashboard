'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { mockProjects } from '@/mock/projects';
import { mockTasks, getTasksByProject, getSubtasks, type Task } from '@/mock/tasks';
import { getUserById } from '@/mock/users';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Drawer } from '@/components/ui/Drawer';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
    StatusCellRenderer,
    PriorityCellRenderer,
    AssigneeCellRenderer,
    DateCellRenderer,
} from '@/components/tables/CellRenderers';
import { defaultGridOptions, applyColumnState, onColumnStateChanged } from '@/lib/ag-grid';
import { cn } from '@/lib/utils';

export default function ProjectTasksPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const project = mockProjects.find((p) => p.id === projectId);
    const projectTasks = getTasksByProject(projectId);

    const gridRef = useRef<AgGridReact<Task>>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDrawer, setShowTaskDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState<'tasks' | 'activity' | 'settings'>('tasks');

    if (!project) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-text-secondary)]">Project not found</p>
            </div>
        );
    }

    const owner = getUserById(project.ownerId);

    const columnDefs: ColDef<Task>[] = [
        {
            field: 'id',
            headerName: 'ID',
            width: 100,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            cellRenderer: (params: any) => {
                // Check if this task has subtasks
                const hasSubtasks = mockTasks.some(t => t.parentTaskId === params.data.id);
                if (hasSubtasks) {
                    return (
                        <div className="h-full flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    params.node.setExpanded(!params.node.expanded);
                                }}
                                className="mr-2"
                            >
                                {params.node.expanded ? '▼' : '▶'}
                            </button>
                            {params.value}
                        </div>
                    );
                }
                return params.value;
            },
        },
        {
            field: 'title',
            headerName: 'Task Name',
            flex: 2,
            minWidth: 250,
            cellStyle: { fontWeight: 500 },
        },
        {
            field: 'status',
            headerName: 'ggStatus',
            width: 140,
            cellRenderer: StatusCellRenderer,
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
    ];

    const onGridReady = useCallback(() => {
        applyColumnState(gridRef.current?.api, `project-${projectId}-tasks-grid`);
    }, [projectId]);

    const onColumnMoved = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, `project-${projectId}-tasks-grid`);
    }, [projectId]);

    const onColumnResized = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, `project-${projectId}-tasks-grid`);
    }, [projectId]);

    const onColumnVisible = useCallback(() => {
        onColumnStateChanged(gridRef.current?.api, `project-${projectId}-tasks-grid`);
    }, [projectId]);

    const onRowClicked = useCallback((event: any) => {
        setSelectedTask(event.data);
        setShowTaskDrawer(true);
    }, []);

    const tabs = [
        { id: 'tasks' as const, label: 'Tasks' },
        { id: 'activity' as const, label: 'Activity' },
        { id: 'settings' as const, label: 'Settings' },
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Breadcrumb & Header */}
                <div>
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-2 text-[var(--color-brand-primary)] hover:underline mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>

                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                                {project.name}
                            </h1>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                {project.description}
                            </p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <Badge
                                    variant={project.status === 'active' ? 'success' : 'default'}
                                    size="md"
                                >
                                    {project.status}
                                </Badge>
                                {owner && (
                                    <div className="flex items-center gap-2">
                                        <Avatar name={owner.name} size="sm" />
                                        <span className="text-sm text-[var(--color-text-secondary)]">
                                            {owner.name}
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm text-[var(--color-text-tertiary)]">
                                    {project.progress}% Complete
                                </span>
                            </div>
                        </div>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-[var(--color-border-primary)]">
                    <nav className="flex gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'pb-3 px-1 border-b-2 font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'tasks' && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
                        <div className="ag-theme-custom ag-theme-quartz-dark" style={{ height: '600px', width: '100%' }}>
                            <AgGridReact<Task>
                                ref={gridRef}
                                rowData={projectTasks}
                                columnDefs={columnDefs}
                                {...defaultGridOptions}
                                onGridReady={onGridReady}
                                onColumnMoved={onColumnMoved}
                                onColumnResized={onColumnResized}
                                onColumnVisible={onColumnVisible}
                                onRowClicked={onRowClicked}
                                rowSelection="multiple"
                                masterDetail={true}
                                detailRowAutoHeight={true}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
                        <p className="text-[var(--color-text-secondary)]">
                            Activity feed coming soon...
                        </p>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
                        <p className="text-[var(--color-text-secondary)]">
                            Project settings coming soon...
                        </p>
                    </div>
                )}
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Assignee
                            </label>
                            <AssigneeCellRenderer value={selectedTask.assigneeId} />
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
