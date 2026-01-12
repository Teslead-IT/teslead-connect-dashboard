'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
    LayoutGrid,
    List as ListIcon,
    Plus,
    Search,
    Filter,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    MoreVertical,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type ViewMode = 'list' | 'kanban';

interface Task {
    id: string;
    name: string;
    status: string;
    priority: string;
    assignee: string;
    startDate: string;
    dueDate: string;
    tags: string[];
    subtasks?: Task[];
    groupName?: string;
    progress: number;
    level?: number;
    isParent?: boolean;
}

const generateMockTasks = (count: number): Task[] => {
    const statuses = ['Open', 'In Progress', 'UAT Done', 'Completed'];
    const priorities = ['High', 'Medium', 'Low'];
    const assignees = ['Sathish Kumar', 'Mike Chen', 'Sarah Johnson', 'Alex Kumar', 'Emma Davis'];
    const groups = ['UX/UI creation', 'Content preparation', 'Development', 'Testing'];
    const tagSets = [['Design', 'UX'], ['Content'], ['Dev', 'Backend'], ['QA']];

    return Array.from({ length: count }, (_, i) => {
        const id = `WD1-${100 + i}`;
        const hasSubtasks = i % 5 === 0;
        const subtasks = hasSubtasks ? Array.from({ length: 2 }, (_, j) => ({
            id: `${id}-${j + 1}`,
            name: `Subtask ${j + 1}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            assignee: assignees[Math.floor(Math.random() * assignees.length)],
            startDate: '2026-02-01',
            dueDate: '2026-02-05',
            tags: ['Subtask'],
            groupName: groups[Math.floor(Math.random() * groups.length)],
            progress: Math.floor(Math.random() * 100),
        })) : undefined;

        return {
            id,
            name: `Task ${i + 1}: Complete API integration`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            assignee: assignees[Math.floor(Math.random() * assignees.length)],
            startDate: '2026-01-26',
            dueDate: '2026-02-10',
            tags: tagSets[Math.floor(Math.random() * tagSets.length)],
            groupName: groups[Math.floor(Math.random() * groups.length)],
            progress: Math.floor(Math.random() * 100),
            subtasks,
        };
    });
};

const MOCK_TASKS: Task[] = generateMockTasks(60);

// ==================== CELL RENDERERS ====================
const StatusRenderer = (props: ICellRendererParams) => {
    const statusColors: Record<string, string> = {
        'Open': 'bg-gray-100 text-gray-700 border-gray-200',
        'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
        'UAT Done': 'bg-green-50 text-green-700 border-green-200',
        'Completed': 'bg-green-100 text-green-800 border-green-300',
    };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border", statusColors[props.value] || statusColors['Open'])}>
            {props.value}
        </span>
    );
};

const PriorityRenderer = (props: ICellRendererParams) => {
    const colors: Record<string, string> = {
        'High': 'bg-red-50 text-red-700',
        'Medium': 'bg-orange-50 text-orange-700',
        'Low': 'bg-gray-100 text-gray-600',
    };
    return (
        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium", colors[props.value] || colors['Low'])}>
            {props.value}
        </span>
    );
};

const AssigneeRenderer = (props: ICellRendererParams) => {
    const initials = props.value?.split(' ').map((n: string) => n[0]).join('') || 'U';
    return (
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {initials}
            </div>
            <span className="text-[12px] text-gray-700 truncate">{props.value}</span>
        </div>
    );
};

const ProgressRenderer = (props: ICellRendererParams) => {
    const progress = props.data.progress || 0;
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-[#091590] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

const DateRenderer = (props: ICellRendererParams) => {
    const formatted = new Date(props.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return <span className="text-[12px] text-gray-600">{formatted}</span>;
};

const TagsRenderer = (props: ICellRendererParams) => {
    const tags = props.value || [];
    return (
        <div className="flex items-center gap-1">
            {tags.slice(0, 2).map((tag: string, idx: number) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                    {tag}
                </span>
            ))}
        </div>
    );
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const flattenedTasks = useMemo(() => {
        const result: Task[] = [];
        MOCK_TASKS.forEach(task => {
            if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) && !task.id.toLowerCase().includes(searchQuery.toLowerCase())) {
                return;
            }
            result.push({ ...task, isParent: true, level: 0 });
            if (task.subtasks && expandedTasks.has(task.id)) {
                task.subtasks.forEach(subtask => {
                    result.push({ ...subtask, level: 1, isParent: false });
                });
            }
        });
        return result;
    }, [expandedTasks, searchQuery]);

    const toggleExpand = useCallback((taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    const TaskNameRenderer = (props: ICellRendererParams) => {
        const { data } = props;
        const hasSubtasks = data.subtasks && data.subtasks.length > 0;
        const isExpanded = expandedTasks.has(data.id);
        const isSubtask = data.level === 1;

        return (
            <div className={cn("flex items-center gap-2 h-full", isSubtask && "pl-8")}>
                {hasSubtasks && (
                    <button onClick={() => toggleExpand(data.id)} className="p-0.5 hover:bg-gray-200 rounded">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                    </button>
                )}
                {!hasSubtasks && data.isParent && <div className="w-5" />}
                <span className={cn("font-medium text-gray-900 truncate", isSubtask && "text-xs text-gray-700")}>
                    {data.name}
                </span>
            </div>
        );
    };

    const columnDefs: ColDef[] = useMemo(() => [
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
            width: 90,
            pinned: 'left',
            cellClass: 'font-semibold text-gray-500 text-[11px]',
        },
        {
            field: 'name',
            headerName: 'TASK NAME',
            width: 350,
            pinned: 'left',
            cellRenderer: TaskNameRenderer,
        },
        {
            field: 'status',
            headerName: 'STATUS',
            width: 130,
            cellRenderer: StatusRenderer,
            filter: false,
            checkboxSelection: false,
            headerCheckboxSelection: false,
        },
        {
            field: 'priority',
            headerName: 'PRIORITY',
            width: 100,
            cellRenderer: PriorityRenderer,
        },
        {
            field: 'progress',
            headerName: 'PROGRESS',
            width: 120,
            cellRenderer: ProgressRenderer,
        },
        {
            field: 'assignee',
            headerName: 'OWNER',
            width: 180,
            cellRenderer: AssigneeRenderer,
        },
        {
            field: 'tags',
            headerName: 'TAGS',
            width: 150,
            cellRenderer: TagsRenderer,
        },
        {
            field: 'startDate',
            headerName: 'START DATE',
            width: 110,
            cellRenderer: DateRenderer,
        },
        {
            field: 'dueDate',
            headerName: 'DUE DATE',
            width: 110,
            cellRenderer: DateRenderer,
        },
        // {
        //     headerName: '',
        //     width: 50,
        //     pinned: 'right',
        //     cellRenderer: () => (
        //         <button className="p-1 hover:bg-gray-100 rounded">
        //             <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
        //         </button>
        //     ),
        // },
    ], [expandedTasks]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        checkboxSelection: false,
        headerCheckboxSelection: false,
    }), []);

    const groupedTasks = useMemo(() => {
        const groups = new Map<string, Task[]>();
        MOCK_TASKS.forEach(task => {
            if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
            const group = task.groupName || 'Other';
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group)!.push(task);
        });
        return Array.from(groups.entries()).map(([name, tasks]) => ({ name, tasks }));
    }, [searchQuery]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/projects')} className="p-1 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">Website Redesign</h1>
                        <span className="text-[11px] text-gray-500">{flattenedTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" className="text-[11px] py-1 px-2.5 h-7">
                            <Filter className="w-3 h-3 mr-1" />Filters
                        </Button>
                        <Button className="text-[11px] py-1 px-2.5 h-7 bg-[#091590] hover:bg-[#071170]">
                            <Plus className="w-3 h-3 mr-1" />Add Task
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 mt-2">
                    <div className="flex-1 max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-[12px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#091590] focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn('flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium', viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600')}
                        >
                            <ListIcon className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn('flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium', viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600')}
                        >
                            <LayoutGrid className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {viewMode === 'list' ? (
                    <div className="h-full ag-theme-alpine">
                        <AgGridReact
                            theme="legacy"
                            rowData={flattenedTasks}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            rowHeight={44}
                            headerHeight={36}
                            suppressRowClickSelection={true}
                            rowSelection="multiple"
                            getRowId={(params) => params.data.id}
                            getRowStyle={(params) => params.data.level === 1 ? { backgroundColor: '#f9fafb' } : undefined}
                            pagination={true}
                            paginationPageSize={25}
                            paginationPageSizeSelector={[25, 50, 100]}
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-auto p-4 bg-gray-50">
                        <div className="flex gap-4 min-w-max">
                            {groupedTasks.map(group => (
                                <div key={group.name} className="flex-shrink-0 w-72 bg-gray-100 rounded-lg">
                                    <div className="px-3 py-2.5 bg-white rounded-t-lg border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 text-[13px]">{group.name}</h3>
                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded">{group.tasks.length}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-2.5 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        {group.tasks.map(task => (
                                            <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{task.id}</p>
                                                        <h4 className="font-semibold text-gray-900 text-[13px] leading-tight">{task.name}</h4>
                                                    </div>
                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <StatusRenderer value={task.status} data={task} />
                                                    <PriorityRenderer value={task.priority} data={task} />
                                                </div>
                                                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                            {task.assignee.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-[11px] text-gray-700 truncate max-w-[100px]">{task.assignee}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
