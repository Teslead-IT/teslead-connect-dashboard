'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
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
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import type { Project, Tag } from '@/types/project';
import { getProjectPermissions, type OrgRole, type ProjectRole } from '@/lib/permissions';

// ==================== TYPE DEFINITIONS ====================
type ViewMode = 'list' | 'kanban';

// ==================== MAIN COMPONENT ====================
const PROJECT_STATUS_OPTIONS = [
    { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-slate-200 text-slate-800 border-slate-300' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'ON_HOLD', label: 'ON_HOLD', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];



export default function ProjectsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // GET State from URL (The single source of truth)
    const selectedOrgId = searchParams.get('orgId') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // React Query Hooks (pass selectedOrgId to filter)
    const { data: projectsData, isLoading: loading, error, refetch } = useProjects({
        orgId: selectedOrgId,
        page,
        limit
    });

    const projects = projectsData?.data || [];
    const meta = projectsData?.meta;

    const createProjectMutation = useCreateProject();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();
    const { data: user, isLoading: isUserLoading } = useUser();
    const toast = useToast();

    // Dialog State
    const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const memberships = user?.memberships || [];

    const handleOrgChange = (orgId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (orgId === 'all') {
            params.delete('orgId');
        } else {
            params.set('orgId', orgId);
        }
        params.set('page', '1'); // Reset to first page on org change
        router.push(`/projects?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/projects?${params.toString()}`);
    };

    const handleLimitChange = (newLimit: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('limit', newLimit.toString());
        params.set('page', '1'); // Reset to first page on limit change
        router.push(`/projects?${params.toString()}`);
    };

    // Fetch members to get owner names
    const { members: orgMembers } = useOrganizationMembers(
        selectedOrgId !== 'all' ? selectedOrgId : (user?.currentOrgId || memberships[0]?.orgId || ''),
        ''
    );

    const memberMap = useMemo(() => {
        const map: Record<string, string> = {};
        orgMembers.forEach((m: any) => {
            if (m.id && m.name) map[m.id] = m.name;
        });
        return map;
    }, [orgMembers]);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        project: Project;
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
                project: params.data,
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
            setDeleteDialog({ id: contextMenu.project.id, name: contextMenu.project.name });
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
        // Client-side filtering of current page
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

    // ==================== PERMISSIONS HELPERS ====================
    /**
     * Resolves the organization and project roles for a given project.
     * Handles Global vs Specific Org view contexts.
     */
    const getProjectRoles = useCallback((project: Project) => {
        // 1. Try finding membership by project's own orgId (most accurate)
        // Check multiple possible field names and nested structure for organization ID to be robust
        const projectOrgId =
            project.orgId ||
            (project as any).organizationId ||
            (project as any).org_id ||
            (project as any).organization?.id ||
            (project as any).org?.id;

        let membership = memberships.find(m => m.orgId === projectOrgId);

        // 2. Fallback: If project has no orgId and we are in a single org view, use that org
        if (!membership && selectedOrgId !== 'all') {
            membership = memberships.find(m => m.orgId === selectedOrgId);
        }

        // 3. Fallback: If still not found and user has only one membership
        if (!membership && memberships.length === 1) {
            membership = memberships[0];
        }

        const orgRole = (membership?.role as OrgRole) || 'MEMBER';
        const projectRole = (project.role as ProjectRole) || 'VIEWER';

        // Improved Global Permission Check: 
        // 1. If we can't map to a specific org, but user is an Admin/Owner in ALL their orgs.
        // 2. If we are in 'all' view and the project's own role is elevated, trust it
        //    if the user is an admin of ANY organization.
        const isEveryOrgAdmin = memberships.length > 0 && memberships.every(m => m.role === 'OWNER' || m.role === 'ADMIN');
        const hasAnyOrgAdmin = memberships.some(m => m.role === 'OWNER' || m.role === 'ADMIN');

        const isOrgOwnerOrAdmin =
            orgRole === 'OWNER' ||
            orgRole === 'ADMIN' ||
            (selectedOrgId === 'all' && isEveryOrgAdmin) ||
            (selectedOrgId === 'all' && !membership && hasAnyOrgAdmin && (projectRole === 'ADMIN' || projectRole === 'OWNER'));

        return {
            orgRole,
            projectRole,
            isOrgOwnerOrAdmin,
            // Display Role: prioritize Org Role if it's elevated
            displayRole: isOrgOwnerOrAdmin ? (orgRole === 'MEMBER' && hasAnyOrgAdmin ? (memberships.find(m => m.role === 'OWNER' || m.role === 'ADMIN')?.role || 'ADMIN') : orgRole) : projectRole
        };
    }, [memberships, selectedOrgId]);

    /**
     * Calculates UI-specific action permissions for a project
     */
    const getProjectPermissionsForUI = useCallback((project: Project) => {
        const { orgRole, projectRole, isOrgOwnerOrAdmin } = getProjectRoles(project);

        const projectPerms = getProjectPermissions(
            user?.id || '',
            project,
            projectRole,
            orgRole
        );

        return {
            canDelete: isOrgOwnerOrAdmin || project.ownerId === user?.id,
            canEdit: isOrgOwnerOrAdmin || projectPerms.canEditProjectSettings,
            canInvite: isOrgOwnerOrAdmin || projectPerms.canAddMembers,
            isOrgOwnerOrAdmin,
            orgRole
        };
    }, [getProjectRoles, user?.id]);

    // ==================== CELL RENDERERS ====================
    const ProjectNameRenderer = (props: ICellRendererParams) => {
        const { name, color, id, description } = props.data;
        const initial = name?.charAt(0) || 'P';
        const router = useRouter();

        const handleClick = () => {
            router.push(`/projects/${id}`);
        };

        return (
            <div className="flex items-center gap-3  group cursor-pointer w-full overflow-hidden" onClick={handleClick}>
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
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-xs block" title={name}>
                            {name}
                        </span>
                        {user?.id && (
                            <span className={cn(
                                "flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border",
                                props.data.ownerId === user?.id
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : "bg-gray-50 text-gray-500 border-gray-100"
                            )}>
                                {props.data.ownerId === user?.id ? "Your's" : (memberMap[props.data.ownerId] || props.data.ownerName || "Owner")}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const AccessRenderer = (props: ICellRendererParams) => {
        const access = props.value;
        const isPrivate = access === 'PRIVATE';

        return (
            <div className="h-full w-full flex items-center">
                <span className={cn(
                    "flex items-center justify-center w-full h-full px-2 text-[10px] font-bold tracking-wide border-0",
                    isPrivate
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-indigo-100 text-indigo-800'
                )}>
                    {access}
                </span>
            </div>
        );
    };

    const RoleRenderer = (props: ICellRendererParams) => {
        const { displayRole, isOrgOwnerOrAdmin } = getProjectRoles(props.data);

        return (
            <div className="h-full w-full flex items-center">
                <span className={cn(
                    "flex items-center justify-center w-full h-full px-2 text-[10px] font-bold border-0",
                    isOrgOwnerOrAdmin
                        ? 'bg-purple-100 text-purple-800'
                        : displayRole === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                )}>
                    {displayRole}
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
        const { canEdit } = getProjectPermissionsForUI(data);
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
                <div className="h-full w-full flex items-center">
                    <span className={cn(
                        "flex items-center justify-center w-full h-full px-3 text-[10px] font-bold tracking-wide border-0",
                        statusConfig.color
                    )}>
                        {statusConfig.label}
                    </span>
                </div>
            );
        }

        return (
            <div className="status-select-wrapper h-full w-full group/status" onClick={(e) => e.stopPropagation()}>
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
                                className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white active:scale-[0.98] font-medium px-4 h-8 text-xs rounded-md ml-1 sm:ml-2 transition-colors duration-200 border border-transparent shadow-sm whitespace-nowrap"
                                title="Create New Project"
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
                                paginationPageSize={limit}
                                suppressPaginationPanel={true}
                                animateRows={true}
                                suppressLoadingOverlay={true}
                                onCellContextMenu={handleCellContextMenu}
                                preventDefaultOnContextMenu={true}
                            />
                        </div>

                        {/* Custom Pagination Controls */}
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white shrink-0">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={!meta?.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{filteredProjects.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium">{Math.min(page * limit, meta?.total || 0)}</span> of <span className="font-medium">{meta?.total || 0}</span> results
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-4"
                                        value={limit}
                                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                                    >
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                        <option value={100}>100 / page</option>
                                    </select>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">First</span>
                                            <span aria-hidden="true">&laquo;</span>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <span aria-hidden="true">&lsaquo;</span>
                                        </button>
                                        <button
                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            {page}
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={!meta?.hasNextPage}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <span aria-hidden="true">&rsaquo;</span>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(meta?.totalPages || 1)}
                                            disabled={!meta?.totalPages || page === meta.totalPages}
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
                ) : (
                    <div className="h-full flex flex-col bg-gray-50">
                        <div className="flex-1 overflow-x-auto p-6">
                            <div className="flex gap-4 h-full min-w-max">
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
                                                    statusProjects.map((project) => {
                                                        const { canEdit, canDelete, isOrgOwnerOrAdmin } = getProjectPermissionsForUI(project);
                                                        const { displayRole } = getProjectRoles(project);

                                                        return (
                                                            <div
                                                                key={project.id}
                                                                draggable={canEdit}
                                                                onDragStart={(e) => {
                                                                    if (!canEdit) {
                                                                        e.preventDefault();
                                                                        return;
                                                                    }
                                                                    e.dataTransfer.setData('projectId', project.id);
                                                                }}
                                                                className={cn(
                                                                    "bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow group",
                                                                    canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                                                                )}
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    setContextMenu({
                                                                        project: project,
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
                                                                                {canEdit && (
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
                                                                                )}
                                                                                {canDelete && (
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
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-xs text-gray-500 font-mono">{project.projectId}</p>
                                                                            {user?.id && (
                                                                                <span className={cn(
                                                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border",
                                                                                    project.ownerId === user?.id
                                                                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                                                                        : "bg-gray-50 text-gray-500 border-gray-100"
                                                                                )}>
                                                                                    {project.ownerId === user?.id ? "Your's" : (memberMap[project.ownerId || ''] || (project as any).ownerName || "Owner")}
                                                                                </span>
                                                                            )}
                                                                        </div>
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
                                                                        "inline-flex items-center px-2 py-0.5 rounded-full font-medium shadow-sm",
                                                                        project.access === 'PRIVATE'
                                                                            ? 'bg-slate-100 text-slate-700'
                                                                            : 'bg-indigo-100 text-indigo-700'
                                                                    )}>
                                                                        {project.access}
                                                                    </span>

                                                                    {/* Role Badge */}
                                                                    <span className={cn(
                                                                        "inline-flex items-center px-2 py-0.5 rounded-full font-medium shadow-sm",
                                                                        isOrgOwnerOrAdmin || project.role === 'ADMIN'
                                                                            ? 'bg-purple-100 text-purple-800'
                                                                            : 'bg-slate-100 text-slate-700'
                                                                    )}>
                                                                        {displayRole}
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
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white shrink-0">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={!meta?.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{filteredProjects.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium">{Math.min(page * limit, meta?.total || 0)}</span> of <span className="font-medium">{meta?.total || 0}</span> results
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mr-4"
                                        value={limit}
                                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                                    >
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                        <option value={100}>100 / page</option>
                                    </select>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">First</span>
                                            <span aria-hidden="true">&laquo;</span>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <span aria-hidden="true">&lsaquo;</span>
                                        </button>
                                        <button
                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                            {page}
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={!meta?.hasNextPage}
                                            className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <span aria-hidden="true">&rsaquo;</span>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(meta?.totalPages || 1)}
                                            disabled={!meta?.totalPages || page === meta.totalPages}
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
                )}
            </div>

            {contextMenu && (() => {
                const { canEdit, canDelete, canInvite } = getProjectPermissionsForUI(contextMenu.project);

                return (
                    <ProjectContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onViewDetails={() => {
                            router.push(`/projects/${contextMenu.project.id}`);
                            setContextMenu(null);
                        }}
                        onDelete={canDelete ? handleDeleteClick : undefined}
                        onEdit={canEdit ? () => {
                            setEditingProject(contextMenu.project);
                            setIsCreateModalOpen(true);
                            setContextMenu(null);
                        } : undefined}
                        onInvite={canInvite ? () => {
                            setInviteModalState({
                                isOpen: true,
                                projectId: contextMenu.project.id,
                                projectName: contextMenu.project.name
                            });
                            setContextMenu(null);
                        } : undefined}
                    />
                );
            })()
            }

            {
                inviteModalState.projectId && (
                    <SendProjectInviteModal
                        isOpen={inviteModalState.isOpen}
                        onClose={() => setInviteModalState({ ...inviteModalState, isOpen: false })}
                        projectId={inviteModalState.projectId}
                        projectName={inviteModalState.projectName || 'Project'}
                    />
                )
            }

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
        </div >
    );
}