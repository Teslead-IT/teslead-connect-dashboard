import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ProjectMember } from '@/types/project';
import { cn } from '@/lib/utils';
import { User, Shield, UserCog, Eye, AtSign, Calendar, MoreVertical } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import { MemberContextMenu } from './MemberContextMenu';
import { AssignTasksToMemberModal } from './AssignTasksToMemberModal';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ProjectMembersTableProps {
    members: ProjectMember[];
    isLoading: boolean;
    projectId: string;
    currentUserRole?: string;
    searchQuery?: string;
}

const ROLE_COLORS = {
    OWNER: 'bg-purple-50 text-purple-700 border-purple-200',
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    MEMBER: 'bg-blue-50 text-blue-700 border-blue-200',
    VIEWER: 'bg-gray-50 text-gray-700 border-gray-200',
};

// Renderers
const MemberNameRenderer = (props: ICellRendererParams) => {
    const member: ProjectMember = props.data;
    const initial = member.user.name.charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-3 h-full">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0 border border-slate-200">
                {member.user.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    initial
                )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
                <span className="font-semibold text-gray-900 text-xs truncate max-w-[200px]" title={member.user.name}>
                    {member.user.name}
                </span>
            </div>
        </div>
    );
};

const EmailRenderer = (props: ICellRendererParams) => {
    return (
        <div className="flex items-center gap-2 h-full text-gray-600">
            <AtSign className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs truncate">{props.value}</span>
        </div>
    );
};

const RoleRenderer = (props: ICellRendererParams) => {
    const role = props.value as keyof typeof ROLE_COLORS;
    const colorClass = ROLE_COLORS[role] || ROLE_COLORS.VIEWER;

    let Icon = User;
    if (role === 'OWNER' || role === 'ADMIN') Icon = Shield;
    if (role === 'MEMBER') Icon = UserCog;
    if (role === 'VIEWER') Icon = Eye;

    return (
        <div className="h-full flex items-center">
            <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border uppercase tracking-wide",
                colorClass
            )}>
                <Icon className="w-3 h-3" />
                {role}
            </span>
        </div>
    );
};

const JoinedDateRenderer = (props: ICellRendererParams) => {
    const date = props.value;
    if (!date) return <span className="text-gray-300">-</span>;

    const formatted = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="flex items-center gap-2 h-full text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs">{formatted}</span>
        </div>
    );
};

const DEFAULT_COL_DEF = {
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: 'bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
};

export function ProjectMembersTable({ members, isLoading, projectId, currentUserRole, searchQuery = '' }: ProjectMembersTableProps) {
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
            field: 'user', // Just for typing
            headerName: 'NAME',
            flex: 2,
            minWidth: 200,
            cellRenderer: MemberNameRenderer,
        },
        {
            field: 'user.email',
            headerName: 'EMAIL',
            flex: 2,
            minWidth: 220,
            cellRenderer: EmailRenderer,
        },
        {
            field: 'role',
            headerName: 'ROLE',
            width: 150,
            cellRenderer: RoleRenderer,
        },
        {
            field: 'joinedAt',
            headerName: 'JOINED',
            width: 150,
            cellRenderer: JoinedDateRenderer,
        },
    ], []);

    const [contextMenu, setContextMenu] = React.useState<{
        member: ProjectMember;
        x: number;
        y: number;
    } | null>(null);

    const [assignModal, setAssignModal] = React.useState<{
        isOpen: boolean;
        member: ProjectMember | null;
    }>({ isOpen: false, member: null });

    // Handle Context Menu
    const handleCellContextMenu = React.useCallback((params: any) => {
        const event = params.event;
        if (event) {
            event.preventDefault();

            // Disable context menu for VIEWERS
            if (currentUserRole === 'VIEWER') {
                return;
            }

            setContextMenu({
                member: params.data,
                x: event.clientX,
                y: event.clientY,
            });
        }
    }, [currentUserRole]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Members</h3>
                <p className="text-sm">There are no members in this project yet.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full ag-theme-alpine">
            <AgGridReact
                theme="legacy"
                rowData={members}
                columnDefs={columnDefs}
                defaultColDef={DEFAULT_COL_DEF}
                quickFilterText={searchQuery || undefined}
                rowHeight={60}
                headerHeight={48}
                pagination={true}
                paginationPageSize={20}
                animateRows={true}
                suppressCellFocus={true}
                onCellContextMenu={handleCellContextMenu}
                preventDefaultOnContextMenu={true}
            />

            {contextMenu && (
                <MemberContextMenu
                    member={contextMenu.member}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onAssignTasks={(member) => setAssignModal({ isOpen: true, member })}
                />
            )}

            {assignModal.isOpen && assignModal.member && (
                <AssignTasksToMemberModal
                    isOpen={assignModal.isOpen}
                    onClose={() => setAssignModal({ isOpen: false, member: null })}
                    member={assignModal.member}
                    projectId={projectId}
                />
            )}
        </div>
    );
}

