'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
    MoreVertical,
    Calendar,
    Filter,
    SlidersHorizontal,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ProjectFormData, CreateProjectModal } from '@/components/ui/CreateProjectModal';
// import { projectsApi } from '@/services/projects.service'; // Removed
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import type { Project, Tag } from '@/types/project';

// ==================== TYPE DEFINITIONS ====================
type ViewMode = 'list' | 'kanban';

// ==================== MAIN COMPONENT ====================
export default function ProjectsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // React Query Hooks
    const { data: projects = [], isLoading: loading, error } = useProjects();
    const createProjectMutation = useCreateProject();

    // Refetch not needed manually with React Query, but if you want a manual reload button:
    const { refetch } = useProjects(); // Actually calling useProjects() multiple times is fine, it shares cache key. 
    // Ideally rename first call to `projectsQuery` or just use the data/refetch from one call.
    // Let's stick to simple usage.

    const handleRetry = () => refetch();

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [projects, searchQuery]);

    // ==================== CELL RENDERERS ====================
    const ProjectNameRenderer = (props: ICellRendererParams) => {
        const { name, color, id, description } = props.data;
        const initial = name?.charAt(0) || 'P';
        const router = useRouter();

        const handleClick = () => {
            router.push(`/projects/${id}`);
        };

        return (
            <div className="flex items-start gap-3 py-1 group cursor-pointer" onClick={handleClick}>
                <div
                    className="w-8 h-8 rounded-md shadow-sm flex items-center justify-center text-white font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{
                        backgroundColor: color || 'var(--primary)',
                        background: color ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--primary)'
                    }}
                >
                    {initial}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-xs flex items-center gap-1.5">
                        {name}
                    </div>
                </div>
            </div>
        );
    };

    const AccessRenderer = (props: ICellRendererParams) => {
        const access = props.value;
        const isPrivate = access === 'PRIVATE';

        return (
            <div className="h-full flex items-center">
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-sm",
                    isPrivate
                        ? 'bg-slate-50 text-slate-600 border-slate-200'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                )}>
                    {access}
                </span>
            </div>
        );
    };

    const RoleRenderer = (props: ICellRendererParams) => {
        const role = props.value;
        const isAdmin = role === 'ADMIN';

        return (
            <div className="h-full flex items-center">
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                    isAdmin
                        ? 'bg-purple-50/50 text-purple-700 border-purple-100'
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                )}>
                    {role}
                </span>
            </div>
        );
    };

    const TagsRenderer = (props: ICellRendererParams) => {
        const tags = props.value || [];

        if (tags.length === 0) {
            return <div className="h-full flex items-center text-[10px] text-gray-400 italic">No tags</div>;
        }

        return (
            <div className="h-full flex items-center gap-1 flex-wrap content-center">
                {tags.slice(0, 2).map((tagObj: Tag, idx: number) => (
                    <span
                        key={idx}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-transparent shadow-sm"
                        style={{
                            backgroundColor: tagObj.color + '15', // Ultra light background
                            color: tagObj.color,
                            borderColor: tagObj.color + '30', // Subtle border
                        }}
                    >
                        {tagObj.name}
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
        const status = props.value;
        const isCompleted = status === 'COMPLETED';

        return (
            <div className="h-full flex items-center">
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-sm",
                    isCompleted
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                )}>
                    {status}
                </span>
            </div>
        );
    };

    const DateRenderer = (props: ICellRendererParams) => {
        const date = props.value;
        if (!date) return <div className="h-full flex items-center text-gray-300">-</div>;

        const formatted = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const isPast = new Date(date) < new Date();
        const isDueDate = props.colDef?.field === 'endDate';

        return (
            <div className="h-full flex items-center gap-2">
                <span className={cn(
                    "text-[11px] font-medium",
                    isDueDate && isPast ? "text-red-500" : "text-gray-600"
                )}>
                    {formatted}
                </span>
            </div>
        );
    };

    // AG-Grid Column Definitions
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
            field: 'projectId',
            headerName: 'ProjectId',
            width: 120,
            cellClass: 'text-gray-400 font-mono text-[10px]',
            suppressMenu: true,
        },
        {
            field: 'name',
            headerName: 'PROJECT', // Main column takes available space
            flex: 2,
            minWidth: 260,
            pinned: 'left',
            cellRenderer: ProjectNameRenderer,
        },
        {
            field: 'tags',
            headerName: 'TAGS',
            flex: 1,
            minWidth: 200,
            cellRenderer: TagsRenderer,
            sortable: false,
        },
        {
            field: 'access',
            headerName: 'ACCESS',
            width: 110,
            cellRenderer: AccessRenderer,
        },
        {
            field: 'status',
            headerName: 'STATUS',
            width: 110,
            cellRenderer: StatusRenderer,
        },
        {
            field: 'role',
            headerName: 'ROLE',
            width: 100,
            cellRenderer: RoleRenderer,
        },
        {
            field: 'startDate',
            headerName: 'START',
            width: 120,
            cellRenderer: DateRenderer,
        },
        {
            field: 'endDate',
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
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
    }), []);

    const handleCreateProject = async (projectData: ProjectFormData) => {
        try {
            await createProjectMutation.mutateAsync({
                name: projectData.name,
                description: projectData.description || undefined,
                color: projectData.color,
                startDate: projectData.startDate || undefined,
                endDate: projectData.endDate || undefined,
                access: projectData.access,
                tags: projectData.tags,
            });
            console.log('Project created successfully');
        } catch (error: any) {
            console.error('Failed to create project:', error);
            // alert('Failed to create project: ' + (error.message || 'Unknown error')); // Optional/handled by UI
            throw error;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* COMPACT Header Section */}
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Title & Count */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Projects</h1>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                            {filteredProjects.length}
                        </span>
                    </div>

                    {/* Right: Search, Filter, Action */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                        {/* Compact Search */}
                        <div className="relative max-w-xs w-full lg:max-w-sm group transition-all">
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

                        {/* Divider */}
                        <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        {/* View Filters */}
                        <div className="flex items-center bg-gray-50 p-0.5 rounded-md border border-gray-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-1 rounded transition-all',
                                    viewMode === 'list'
                                        ? 'bg-white text-[var(--primary)] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="List View"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    'p-1 rounded transition-all',
                                    viewMode === 'kanban'
                                        ? 'bg-white text-[var(--primary)] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}
                                title="Kanban View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white cursor-pointer active:scale-[0.98] font-medium px-4 h-8 text-xs rounded-md ml-2 transition-colors duration-200 border border-transparent shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            New Project
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-0 bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
                            <MoreVertical className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-md font-semibold text-gray-900">Error loading projects</h3>
                        <h3 className="text-md font-semibold text-gray-900">Error loading projects</h3>
                        <p className="text-sm text-gray-500">{(error as Error)?.message || 'Unknown error'}</p>
                        <Button variant="primary" size="sm" onClick={handleRetry} className="mt-2">
                            Retry
                        </Button>
                    </div>
                ) : viewMode === 'list' ? (
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
                                    background-color: #f1f5f9 !important; /* Slate-100 for visibility */
                                    border-bottom: 1px solid #cbd5e1 !important; /* Slate-300 for boundary */
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
                                    color: #334155 !important; /* Slate-700 */
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
                                    color: #0f172a; /* Slate-900 */
                                    font-size: 13px;
                                    font-weight: 500;
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
                                rowData={filteredProjects}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}

                                rowHeight={48}
                                headerHeight={40}
                                pagination={true}
                                paginationPageSize={20}
                                paginationPageSizeSelector={[20, 50, 100]}
                                animateRows={true}
                                suppressLoadingOverlay={true}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-auto p-4 bg-gray-50 flex items-center justify-center">
                        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200">
                            <LayoutGrid className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">
                                Kanban view coming soon
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProject}
            />
        </div>
    );
}