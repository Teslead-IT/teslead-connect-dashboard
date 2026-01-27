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
    ArrowUpRight,
    ChevronDown,
    Pencil,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ProjectFormData, CreateProjectModal } from '@/components/ui/CreateProjectModal';
import { ProjectContextMenu } from '@/components/projects/ProjectContextMenu';
import { SendProjectInviteModal } from '@/components/invitations';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useAuth, useUser, useSwitchOrg } from '@/hooks/use-auth';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { Project, Tag } from '@/types/project';

// ==================== TYPE DEFINITIONS ====================
type ViewMode = 'list' | 'kanban';

// ==================== MAIN COMPONENT ====================
const PROJECT_STATUS_OPTIONS = [
    { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'ON_HOLD', label: 'On Hold', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
];



export default function ProjectsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // React Query Hooks (pass selectedOrgId to filter)
    const { data: projects = [], isLoading: loading, error } = useProjects({
        orgId: selectedOrgId
    });
    const createProjectMutation = useCreateProject();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();
    const { data: user, isLoading: isUserLoading } = useUser();
    const toast = useToast();
    const router = useRouter();

    // Dialog State
    const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const memberships = user?.memberships || [];

    const handleOrgChange = (orgId: string) => {
        setSelectedOrgId(orgId);
    };

    const { refetch } = useProjects();

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        projectId: string;
        projectName: string;
        role: string;
        x: number;
        y: number;
    } | null>(null);

    // Invite Modal State
    const [inviteModalState, setInviteModalState] = useState<{
        isOpen: boolean;
        projectId?: string;
        projectName?: string;
    }>({ isOpen: false });

    // Handle Context Menu
    const handleCellContextMenu = useCallback((params: any) => {
        const event = params.event;
        if (event) {
            event.preventDefault();
            setContextMenu({
                projectId: params.data.id,
                projectName: params.data.name,
                role: params.data.role,
                x: event.clientX,
                y: event.clientY,
            });
        }
    }, []);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
    const handleRetry = () => refetch();

    const handleDeleteClick = () => {
        if (contextMenu) {
            setDeleteDialog({ id: contextMenu.projectId, name: contextMenu.projectName });
            setContextMenu(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog) return;

        setIsDeleting(true);
        const toastId = toast.loading('Deleting project...');

        try {
            await deleteProjectMutation.mutateAsync(deleteDialog.id);
            toast.success('Project deleted successfully', undefined, { id: toastId, soundEnabled: true });
            setDeleteDialog(null);
        } catch (error: any) {
            console.error('Failed to delete project:', error);
            // Extract error message from various possible locations in the error object
            const errorMessage = error.response?.data?.message ||
                error.response?.message ||
                error.message ||
                'Unknown error occurred';

            toast.error('Failed to delete project', errorMessage, { id: toastId, soundEnabled: true });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [projects, searchQuery]);

    const handleUpdateProjectStatus = useCallback(async (projectId: string, newStatus: string) => {
        try {
            await updateProjectMutation.mutateAsync({
                id: projectId,
                data: { status: newStatus as any }
            });
            toast.success('Project status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    }, [updateProjectMutation, toast]);

    // ==================== CELL RENDERERS ====================
    const ProjectNameRenderer = (props: ICellRendererParams) => {
        const { name, color, id, description } = props.data;
        const initial = name?.charAt(0) || 'P';
        const router = useRouter();

        const handleClick = () => {
            router.push(`/projects/${id}`);
        };

        return (
            <div className="flex items-center gap-3 py-1 group cursor-pointer w-full overflow-hidden" onClick={handleClick}>
                <div
                    className="w-8 h-8 rounded-md shadow-sm flex items-center justify-center text-white font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{
                        backgroundColor: color || 'var(--primary)',
                        background: color ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--primary)'
                    }}
                >
                    {initial}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-1.5 w-full">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-xs block w-full" title={name}>
                            {name}
                        </span>
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
        const { value: status, data } = props;
        const role = data.role;
        // User requested: "inline status edit allowed to only for role admin...for member and viewer dont allow"
        // We include OWNER as they should have full permissions.
        const canEdit = role === 'ADMIN' || role === 'OWNER';
        const { onUpdateStatus } = props.context || {};

        const statusConfig = PROJECT_STATUS_OPTIONS.find(s => s.value === status) || {
            value: status,
            label: status,
            color: 'bg-gray-50 text-gray-600 border-gray-200'
        };

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newStatus = e.target.value;
            if (newStatus !== status && onUpdateStatus) {
                onUpdateStatus(data.id, newStatus);
            }
        };

        if (!canEdit) {
            return (
                <div className="h-full flex items-center">
                    <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-sm",
                        statusConfig.color
                    )}>
                        {statusConfig.label}
                    </span>
                </div>
            );
        }

        return (
            <div className="status-select-wrapper group/status" onClick={(e) => e.stopPropagation()}>
                <select
                    value={status}
                    onChange={handleChange}
                    className={cn(
                        "status-select-base",
                        statusConfig.color
                    )}
                    style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                    }}
                >
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="status-select-icon" />
            </div>
        );
    };

    const DateRenderer = (props: ICellRendererParams) => {
        const date = props.value;
        if (!date) return <div className="h-full flex items-center text-gray-300">-</div>;

        const targetDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formatted = targetDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const isDueDate = props.colDef?.field === 'endDate';
        const isPast = diffDays < 0;
        const isNearDue = diffDays >= 0 && diffDays <= 5;

        const daysText = isNearDue ? `(${diffDays} days)` : '';

        return (
            <div className="h-full flex items-center gap-2">
                <span className={cn(
                    "text-[11px] font-medium",
                    isDueDate && (isPast || isNearDue) ? "text-red-500 font-bold" : "text-gray-600"
                )}>
                    {formatted} {isDueDate && isNearDue && <span className="text-[10px] ml-1 opacity-90">{daysText}</span>}
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
            field: 'projectId',
            headerName: 'ProjectId',
            width: 120,
            cellClass: 'text-gray-400 font-mono text-[10px]',
            suppressMenu: true,
        },
        {
            field: 'name',
            headerName: 'PROJECT',
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
            width: 140,
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

    const handleProjectFormSubmit = async (projectData: ProjectFormData) => {
        const isEdit = !!editingProject;
        const toastId = toast.loading(isEdit ? 'Updating project...' : 'Creating project...');

        try {
            if (isEdit) {
                await updateProjectMutation.mutateAsync({
                    id: editingProject.id,
                    data: {
                        name: projectData.name,
                        description: projectData.description,
                        color: projectData.color,
                        startDate: projectData.startDate,
                        endDate: projectData.endDate,
                        access: projectData.access,
                        status: projectData.status,
                        tags: projectData.tags
                    }
                });
                toast.success('Project updated successfully', undefined, { id: toastId, soundEnabled: true });
            } else {
                await createProjectMutation.mutateAsync({
                    name: projectData.name,
                    description: projectData.description || undefined,
                    color: projectData.color,
                    startDate: projectData.startDate || undefined,
                    endDate: projectData.endDate || undefined,
                    access: projectData.access,
                    status: projectData.status,
                    tags: projectData.tags,
                    orgId: projectData.orgId,
                });
                toast.success('Project created successfully', undefined, { id: toastId, soundEnabled: true });
            }
            setIsCreateModalOpen(false);
            setEditingProject(null);
        } catch (error: any) {
            console.error('Failed to save project:', error);
            toast.error(
                isEdit ? 'Failed to update project' : 'Failed to create project',
                error.message || 'Unknown error',
                { id: toastId, soundEnabled: true }
            );
        }
    };

    return (
        <div className="h-full flex flex-col bg-white" onContextMenu={(e) => e.preventDefault()}>
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Projects</h1>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                                {filteredProjects.length}
                            </span>
                        </div>

                        {memberships.length > 0 && (
                            <div className="ml-2 relative">
                                <select
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-[#091590] focus:border-[#091590] cursor-pointer min-w-[200px] hover:border-gray-300 transition-colors shadow-sm"
                                    value={selectedOrgId}
                                    onChange={(e) => handleOrgChange(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="all">Global (All Projects)</option>
                                    {memberships
                                        .filter(m => m.status === 'ACTIVE')
                                        .map((m) => (
                                            <option key={m.orgId} value={m.orgId}>
                                                {m.orgName} • {m.role}
                                            </option>
                                        ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    {loading ? (
                                        <div className="w-3 h-3 border-2 border-gray-300 border-t-[#091590] rounded-full animate-spin"></div>
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                </div>
                            </div>
                        )}
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
                            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

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

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white cursor-pointer active:scale-[0.98] font-medium px-4 h-8 text-xs rounded-md ml-1 sm:ml-2 transition-colors duration-200 border border-transparent shadow-sm whitespace-nowrap"
                            >
                                <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">New Project</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                                rowData={filteredProjects}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                context={{ onUpdateStatus: handleUpdateProjectStatus }}
                                rowHeight={48}
                                headerHeight={40}
                                pagination={true}
                                paginationPageSize={20}
                                paginationPageSizeSelector={[20, 50, 100]}
                                animateRows={true}
                                suppressLoadingOverlay={true}
                                onCellContextMenu={handleCellContextMenu}
                                preventDefaultOnContextMenu={true}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-x-auto p-6 bg-gray-50">
                        <div className="flex gap-4 h-[calc(100vh-200px)] min-w-max">
                            {PROJECT_STATUS_OPTIONS.map((statusOption) => {
                                const statusProjects = filteredProjects.filter(
                                    p => p.status === statusOption.value
                                );

                                return (
                                    <div
                                        key={statusOption.value}
                                        className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 flex flex-col"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const projectId = e.dataTransfer.getData('projectId');
                                            if (projectId) {
                                                handleUpdateProjectStatus(projectId, statusOption.value);
                                            }
                                        }}
                                    >
                                        {/* Column Header */}
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 text-sm">{statusOption.label}</h3>
                                                    <span className={cn(
                                                        "text-xs font-medium px-2 py-0.5 rounded-full",
                                                        statusOption.color
                                                    )}>
                                                        {statusProjects.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Drop Zone */}
                                        <div className="p-3 space-y-3 overflow-y-auto flex-1">
                                            {statusProjects.length === 0 ? (
                                                <div className="text-center py-8 text-gray-400 text-sm">
                                                    No projects
                                                </div>
                                            ) : (
                                                statusProjects.map((project) => (
                                                    <div
                                                        key={project.id}
                                                        draggable={project.role === 'ADMIN' || project.role === 'OWNER'}
                                                        onDragStart={(e) => {
                                                            if (!(project.role === 'ADMIN' || project.role === 'OWNER')) {
                                                                e.preventDefault();
                                                                return;
                                                            }
                                                            e.dataTransfer.setData('projectId', project.id);
                                                        }}
                                                        className={cn(
                                                            "bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow group",
                                                            (project.role === 'ADMIN' || project.role === 'OWNER') ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                                                        )}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            setContextMenu({
                                                                projectId: project.id,
                                                                projectName: project.name,
                                                                role: project.role,
                                                                x: e.clientX,
                                                                y: e.clientY,
                                                            });
                                                        }}
                                                    >
                                                        {/* Project Header */}
                                                        <div className="flex items-start gap-3 mb-2">
                                                            <div
                                                                className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                                                style={{
                                                                    backgroundColor: project.color || '#091590',
                                                                    background: project.color
                                                                        ? `linear-gradient(135deg, ${project.color}, ${project.color}dd)`
                                                                        : undefined
                                                                }}
                                                            >
                                                                {project.name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h4
                                                                        className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 cursor-pointer transition-colors flex-1"
                                                                        onClick={() => router.push(`/projects/${project.id}`)}
                                                                    >
                                                                        {project.name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {(project.role === 'OWNER' || project.role === 'ADMIN') && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingProject(project);
                                                                                        setIsCreateModalOpen(true);
                                                                                    }}
                                                                                    className="p-1 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded transition-colors"
                                                                                    title="Edit Project"
                                                                                >
                                                                                    <Pencil className="w-3 h-3" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setDeleteDialog({ id: project.id, name: project.name });
                                                                                    }}
                                                                                    className="p-1 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded transition-colors"
                                                                                    title="Delete Project"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-gray-500">{project.projectId}</p>
                                                            </div>
                                                        </div>

                                                        {/* Project Description */}
                                                        {project.description && (
                                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                                {project.description}
                                                            </p>
                                                        )}

                                                        {/* Project Meta */}
                                                        <div className="flex items-center gap-2 flex-wrap text-xs">
                                                            {/* Access Badge */}
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full font-medium",
                                                                project.access === 'PRIVATE'
                                                                    ? 'bg-slate-50 text-slate-600'
                                                                    : 'bg-indigo-50 text-indigo-600'
                                                            )}>
                                                                {project.access}
                                                            </span>

                                                            {/* Role Badge */}
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full font-medium",
                                                                project.role === 'ADMIN'
                                                                    ? 'bg-purple-50 text-purple-700'
                                                                    : 'bg-gray-50 text-gray-600'
                                                            )}>
                                                                {project.role}
                                                            </span>

                                                            {/* Tags */}
                                                            {project.tags && project.tags.length > 0 && (
                                                                <div className="flex gap-1">
                                                                    {project.tags.slice(0, 2).map((tag, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                                                                            style={{
                                                                                backgroundColor: `${tag.color}15`,
                                                                                color: tag.color,
                                                                            }}
                                                                        >
                                                                            {tag.name}
                                                                        </span>
                                                                    ))}
                                                                    {project.tags.length > 2 && (
                                                                        <span className="text-[10px] text-gray-400">
                                                                            +{project.tags.length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dates */}
                                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                                            {project.startDate && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(project.startDate).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </div>
                                                            )}
                                                            {project.endDate && (
                                                                <div className="flex items-center gap-1 text-red-600">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(project.endDate).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {contextMenu && (
                <ProjectContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onViewDetails={() => {
                        router.push(`/projects/${contextMenu.projectId}`);
                        setContextMenu(null);
                    }}
                    onDelete={(contextMenu.role === 'OWNER' || contextMenu.role === 'ADMIN') ? handleDeleteClick : undefined}
                    onEdit={(contextMenu.role === 'OWNER' || contextMenu.role === 'ADMIN') ? () => {
                        const project = projects.find(p => p.id === contextMenu.projectId);
                        if (project) {
                            setEditingProject(project);
                            setIsCreateModalOpen(true);
                        }
                        setContextMenu(null);
                    } : undefined}
                    onInvite={(contextMenu.role === 'OWNER' || contextMenu.role === 'ADMIN') ? () => {
                        setInviteModalState({
                            isOpen: true,
                            projectId: contextMenu.projectId,
                            projectName: contextMenu.projectName
                        });
                        setContextMenu(null);
                    } : undefined}
                />
            )}

            {inviteModalState.projectId && (
                <SendProjectInviteModal
                    isOpen={inviteModalState.isOpen}
                    onClose={() => setInviteModalState({ ...inviteModalState, isOpen: false })}
                    projectId={inviteModalState.projectId}
                    projectName={inviteModalState.projectName || 'Project'}
                />
            )}

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingProject(null);
                }}
                onSubmit={handleProjectFormSubmit}
                defaultOrgId={selectedOrgId !== 'all' ? selectedOrgId : undefined}
                initialData={editingProject ? {
                    name: editingProject.name,
                    description: editingProject.description || '',
                    color: editingProject.color || '#3B82F6',
                    startDate: editingProject.startDate || '',
                    endDate: editingProject.endDate || '',
                    access: editingProject.access,
                    status: editingProject.status,
                    tags: editingProject.tags.map(t => ({ name: t.name, color: t.color })),
                    orgId: editingProject.orgId || user?.currentOrgId,
                } : undefined}
            />

            <ToastContainer />

            <Dialog
                isOpen={!!deleteDialog}
                onClose={() => setDeleteDialog(null)}
                type="warning"
                title="Delete Project"
                message={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone and will remove all tasks and data associated with this project.`}
                confirmText="Delete Project"
                confirmVariant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </div>
    );
}