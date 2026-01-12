'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowDragEndEvent, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
    LayoutGrid,
    List as ListIcon,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ==================== TYPE DEFINITIONS ====================
type ViewMode = 'list' | 'kanban';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    owner: string;
    team: string[];
    startDate: string;
    endDate: string;
    budget: number;
    tags: string[];
    tasksCompleted: number;
    tasksTotal: number;
}

// ==================== MOCK DATA GENERATOR ====================
const generateMockProjects = (count: number): Project[] => {
    const statuses = ['planning', 'in-progress', 'completed'];
    const priorities = ['high', 'medium', 'low'];
    const owners = ['Sarah Johnson', 'Mike Chen', 'Alex Kumar', 'Emma Davis', 'David Park', 'Lisa Wong', 'John Smith', 'Jane Doe'];
    const projectTypes = ['Website', 'Mobile App', 'Database', 'Marketing Campaign', 'API Integration', 'Cloud Migration', 'Analytics Dashboard', 'E-commerce Platform'];
    const tags = [['Design', 'Frontend'], ['Mobile', 'Development'], ['Backend', 'Infrastructure'], ['Marketing', 'Content'], ['Integration', 'API'], ['Cloud', 'DevOps'], ['Analytics', 'BI'], ['E-commerce', 'Sales']];

    const projects: Project[] = [];

    for (let i = 1; i <= count; i++) {
        const typeIndex = i % projectTypes.length;
        const status = statuses[i % statuses.length];
        const priority = priorities[i % priorities.length];
        const owner = owners[i % owners.length];
        const progress = status === 'completed' ? 100 : status === 'planning' ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 70) + 30;
        const tasksTotal = Math.floor(Math.random() * 20) + 10;
        const tasksCompleted = Math.floor((progress / 100) * tasksTotal);

        // Generate team
        const teamSize = Math.floor(Math.random() * 4) + 2;
        const team = Array.from({ length: teamSize }, (_, idx) => owners[(i + idx) % owners.length]);

        projects.push({
            id: `PRJ-${String(i).padStart(3, '0')}`,
            name: `${projectTypes[typeIndex]} ${i}`,
            description: `Project description for ${projectTypes[typeIndex]} ${i}`,
            status,
            priority,
            progress,
            owner,
            team,
            startDate: new Date(2026, 0, (i % 28) + 1).toISOString().split('T')[0],
            endDate: new Date(2026, (i % 12), (i % 28) + 1).toISOString().split('T')[0],
            budget: Math.floor(Math.random() * 100000) + 20000,
            tags: tags[typeIndex],
            tasksCompleted,
            tasksTotal,
        });
    }

    return projects;
};

// Generate 60 mock projects for pagination testing
const MOCK_PROJECTS: Project[] = generateMockProjects(60);

// ==================== CELL RENDERERS ====================
const ProjectNameRenderer = (props: ICellRendererParams) => {
    const { name, tasksCompleted, tasksTotal, id } = props.data;
    const initial = name?.charAt(0) || 'P';
    const router = useRouter();

    const handleClick = () => {
        router.push(`/projects/${id}`);
    };

    return (
        <div className="flex items-center gap-2" onClick={handleClick}>
            <div className="w-7 h-7 rounded bg-[#091590] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                {initial}
            </div>
            <div className="min-w-0">
                <div className="font-semibold text-gray-900 hover:text-[#091590] cursor-pointer truncate text-[13px]">
                    {name}
                </div>
                <div className="text-[11px] text-gray-500">
                    {tasksCompleted}/{tasksTotal} tasks
                </div>
            </div>
        </div>
    );
};

const StatusRenderer = (props: ICellRendererParams) => {
    const status = props.value;
    const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
        'planning': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
        'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'completed': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    };
    const config = statusConfig[status] || statusConfig['planning'];

    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
            config.bg, config.text, config.border
        )}>
            {status.replace('-', ' ').toUpperCase()}
        </span>
    );
};

const PriorityRenderer = (props: ICellRendererParams) => {
    const priority = props.value;
    const priorityConfig: Record<string, { bg: string; text: string }> = {
        'high': { bg: 'bg-red-50', text: 'text-red-700' },
        'medium': { bg: 'bg-orange-50', text: 'text-orange-700' },
        'low': { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    const config = priorityConfig[priority] || priorityConfig['low'];

    return (
        <span className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium",
            config.bg, config.text
        )}>
            {priority.toUpperCase()}
        </span>
    );
};

const ProgressRenderer = (props: ICellRendererParams) => {
    const progress = props.value;

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full bg-[#091590] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-[12px] font-semibold text-gray-700 w-9 text-right">
                {progress}%
            </span>
        </div>
    );
};

const OwnerRenderer = (props: ICellRendererParams) => {
    const owner = props.value;
    const initials = owner?.split(' ').map((n: string) => n[0]).join('') || 'U';

    return (
        <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {initials}
            </div>
            <span className="text-[12px] text-gray-700 truncate">{owner}</span>
        </div>
    );
};

const TeamRenderer = (props: ICellRendererParams) => {
    const team = props.value || [];
    const avatarColors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600'];

    return (
        <div className="flex items-center -space-x-1.5">
            {team.slice(0, 3).map((member: string, idx: number) => {
                const initials = member.split(' ').map((n: string) => n[0]).join('');
                return (
                    <div
                        key={idx}
                        className={cn(
                            "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold border-2 border-white",
                            avatarColors[idx % 3]
                        )}
                        title={member}
                    >
                        {initials}
                    </div>
                );
            })}
            {team.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold border-2 border-white">
                    +{team.length - 3}
                </div>
            )}
        </div>
    );
};

const DateRenderer = (props: ICellRendererParams) => {
    const date = props.value;
    const formatted = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return <span className="text-[12px] text-gray-600">{formatted}</span>;
};

const BudgetRenderer = (props: ICellRendererParams) => {
    const budget = props.value;
    return <span className="text-[12px] font-semibold text-gray-700">₹{budget?.toLocaleString()}</span>;
};

const ActionsRenderer = () => {
    return (
        <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
    );
};

// ==================== KANBAN COLUMNS CONFIG ====================
const KANBAN_COLUMNS = [
    { id: 'planning', title: 'Planning', color: 'border-gray-400' },
    { id: 'in-progress', title: 'In Progress', color: 'border-[#091590]' },
    { id: 'completed', title: 'Completed', color: 'border-green-500' },
];

// ==================== MAIN COMPONENT ====================
export default function ProjectsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    // AG-Grid Column Definitions
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
            width: 95,
            pinned: 'left',
            cellClass: 'font-semibold text-gray-600 text-[12px]',
        },
        {
            field: 'name',
            headerName: 'PROJECT NAME',
            width: 240,
            pinned: 'left',
            cellRenderer: ProjectNameRenderer,
        },
        {
            field: 'status',
            headerName: 'STATUS',
            width: 130,
            cellRenderer: StatusRenderer,
            checkboxSelection: false,
            headerCheckboxSelection: false,
        },
        {
            field: 'priority',
            headerName: 'PRIORITY',
            width: 105,
            cellRenderer: PriorityRenderer,
        },
        {
            field: 'progress',
            headerName: 'PROGRESS',
            width: 150,
            cellRenderer: ProgressRenderer,
        },
        {
            field: 'owner',
            headerName: 'OWNER',
            width: 170,
            cellRenderer: OwnerRenderer,
        },
        {
            field: 'team',
            headerName: 'TEAM',
            width: 130,
            cellRenderer: TeamRenderer,
        },
        {
            field: 'endDate',
            headerName: 'DUE DATE',
            width: 120,
            cellRenderer: DateRenderer,
        },
        {
            field: 'budget',
            headerName: 'BUDGET',
            width: 115,
            cellRenderer: BudgetRenderer,
        },
        // {
        //     headerName: 'ACTIONS',
        //     width: 80,
        //     pinned: 'right',
        //     cellRenderer: ActionsRenderer,
        // },
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        checkboxSelection: false,
        headerCheckboxSelection: false,
    }), []);

    const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
        const movingNode = event.node;
        const overNode = event.overNode;
        if (!overNode || !movingNode) return;

        const fromIndex = projects.findIndex(p => p.id === movingNode.data.id);
        const toIndex = projects.findIndex(p => p.id === overNode.data.id);

        const newProjects = [...projects];
        newProjects.splice(fromIndex, 1);
        newProjects.splice(toIndex, 0, movingNode.data);
        setProjects(newProjects);
    }, [projects]);

    // Kanban handlers
    const handleKanbanDragStart = (e: React.DragEvent, project: Project) => {
        e.dataTransfer.setData('projectId', project.id);
    };

    const handleKanbanDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData('projectId');
        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, status } : p
        ));
    };

    const handleKanbanDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Ultra-Compact Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
                {/* Single Row Layout */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: Title + Count */}
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-lg font-bold text-gray-900">Projects</h1>
                        <span className="text-[11px] text-gray-500">
                            {filteredProjects.length} total
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* <Button variant="secondary" className="text-[11px] py-1 px-2.5 h-7">
                            <Filter className="w-3 h-3 mr-1" />
                            Filters
                        </Button> */}
                        {/* <Button className="text-[11px] py-1 px-2.5 h-7 bg-[#091590] hover:bg-[#071170]">
                            <Plus className="w-3 h-3 mr-1" />
                            New
                        </Button> */}
                    </div>
                </div>

                {/* Second Row: Search + View Toggle */}
                <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-[12px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#091590] focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                                viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 cursor-pointer'
                            )}
                        >
                            <ListIcon className="w-3 h-3" />

                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                                viewMode === 'kanban'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 cursor-pointer'
                            )}
                        >
                            <LayoutGrid className="w-3 h-3" />

                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area - Fixed Height */}
            <div className="flex-1 overflow-hidden bg-white">
                {viewMode === 'list' ? (
                    <div className="h-full ag-theme-alpine">
                        <AgGridReact
                            theme="legacy"
                            rowData={filteredProjects}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            rowSelection="multiple"
                            suppressRowClickSelection={true}
                            onRowDragEnd={onRowDragEnd}
                            rowHeight={44}
                            headerHeight={36}
                            pagination={true}
                            paginationPageSize={25}
                            paginationPageSizeSelector={[25, 50, 100]}
                            suppressPaginationPanel={false}
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-x-auto overflow-y-auto p-4 bg-gray-50">
                        <div className="flex gap-4 min-w-max h-full">
                            {KANBAN_COLUMNS.map(column => {
                                const columnProjects = filteredProjects.filter(p => p.status === column.id);

                                return (
                                    <div
                                        key={column.id}
                                        className="flex-shrink-0 w-72 flex flex-col bg-gray-100 rounded-lg"
                                        onDrop={(e) => handleKanbanDrop(e, column.id)}
                                        onDragOver={handleKanbanDragOver}
                                    >
                                        <div className={cn("px-3 py-2.5 border-b-3 rounded-t-lg bg-white", column.color)}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900 text-[13px]">{column.title}</h3>
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded">
                                                    {columnProjects.length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                                            {columnProjects.map(project => (
                                                <div
                                                    key={project.id}
                                                    draggable
                                                    onDragStart={(e) => handleKanbanDragStart(e, project)}
                                                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move group"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-semibold text-gray-900 text-[13px] leading-tight flex-1 group-hover:text-[#091590] transition-colors">
                                                            {project.name}
                                                        </h4>
                                                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                                            <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                                                        </button>
                                                    </div>

                                                    <p className="text-[11px] text-gray-600 mb-2 line-clamp-2">
                                                        {project.description}
                                                    </p>

                                                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                            project.priority === 'high' ? 'bg-red-50 text-red-700' :
                                                                project.priority === 'medium' ? 'bg-orange-50 text-orange-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                        )}>
                                                            {project.priority}
                                                        </span>
                                                        {project.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mb-2.5">
                                                        <div className="flex items-center justify-between text-[11px] mb-1">
                                                            <span className="text-gray-600">Progress</span>
                                                            <span className="font-semibold text-gray-900">{project.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-[#091590] h-1.5 rounded-full transition-all"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                                                        <div className="flex items-center -space-x-1.5">
                                                            {project.team.slice(0, 3).map((member, idx) => {
                                                                const initials = member.split(' ').map(n => n[0]).join('');
                                                                const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600'];
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold border-2 border-white",
                                                                            colors[idx % 3]
                                                                        )}
                                                                        title={member}
                                                                    >
                                                                        {initials}
                                                                    </div>
                                                                );
                                                            })}
                                                            {project.team.length > 3 && (
                                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold border-2 border-white">
                                                                    +{project.team.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="text-[11px]">
                                                                {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {columnProjects.length === 0 && (
                                                <div className="text-center py-6 text-gray-400 text-[12px]">
                                                    No projects
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
