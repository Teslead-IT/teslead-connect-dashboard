/**
 * Centralized Permission System
 * Based on PERMISSION_DESIGN.md and FRONTEND_API_GUIDE.md
 * 
 * This module provides a clean, type-safe way to check permissions
 * instead of inline role checks scattered across components.
 */

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/**
 * Organization-level permissions
 */
export interface OrgPermissions {
    // Invite and member management (Org creator only)
    canInviteToOrg: boolean;
    canResendInvite: boolean;
    canUpdateMemberRole: boolean;

    // Project management
    canCreateProject: boolean;
    canAddToProject: boolean;

    // Organization settings
    canUpdateOrgSettings: boolean;
    canDeleteOrg: boolean;

    // Project-specific permissions (require project context)
    canDeleteProject: (project: { ownerId?: string | null }) => boolean;
    canEditProject: (project: { ownerId?: string | null }) => boolean;

    // Task permissions
    canWorkOnTasks: boolean;
}

/**
 * Project-level permissions
 */
export interface ProjectPermissions {
    canCreateTask: boolean;
    canEditTask: boolean;
    canDeleteTask: boolean;
    canAssignTask: boolean;
    canUpdateTaskStatus: boolean;
    canManageWorkflow: boolean;
    canEditProjectSettings: boolean;
    canAddMembers: boolean;
    canRemoveMembers: boolean;
}

/**
 * Calculate organization-level permissions
 * 
 * @param userId - Current user ID
 * @param org - Organization object (must include ownerId)
 * @param orgRole - User's role in the organization
 * @returns Object with permission flags
 */
export function getOrgPermissions(
    userId: string,
    org: { ownerId?: string | null } | null,
    orgRole: OrgRole
): OrgPermissions {
    const isCreator = org?.ownerId === userId;
    const isOwner = orgRole === 'OWNER';
    const isOwnerOrAdmin = orgRole === 'OWNER' || orgRole === 'ADMIN';

    return {
        // Invite and member management - Relaxed to allow OWNER/ADMIN
        // This handles cases where ownerId might be missing from backend
        canInviteToOrg: isOwnerOrAdmin,
        canResendInvite: isOwnerOrAdmin,

        // Update role: Allow any OWNER (not just creator)
        canUpdateMemberRole: isOwner,

        // OWNER and ADMIN can manage projects
        canCreateProject: isOwnerOrAdmin,
        canAddToProject: isOwnerOrAdmin,

        // Only OWNER (creator or invited) can update org settings
        canUpdateOrgSettings: isOwner,
        canDeleteOrg: isCreator, // Only creator can delete org

        // Project-specific: owner can delete/edit their own projects, OWNER role can edit any
        canDeleteProject: (project) => project.ownerId === userId,
        canEditProject: (project) => project.ownerId === userId || isOwner,

        // All org members can work on tasks (if they have project access)
        canWorkOnTasks: true,
    };
}

/**
 * Calculate project-level permissions
 * 
 * @param userId - Current user ID
 * @param project - Project object
 * @param projectRole - User's role in the project
 * @param orgRole - User's org role (for elevated permissions)
 * @returns Object with project permission flags
 */
export function getProjectPermissions(
    userId: string,
    project: { ownerId?: string | null } | null,
    projectRole: ProjectRole,
    orgRole: OrgRole
): ProjectPermissions {
    const isProjectOwner = project?.ownerId === userId;
    const isOrgOwner = orgRole === 'OWNER';
    const isOrgAdmin = orgRole === 'ADMIN';
    const isProjectAdmin = projectRole === 'ADMIN';
    const isViewer = projectRole === 'VIEWER';

    // Viewers can only view, not edit
    const canEdit = !isViewer;

    // Admins (project or org) + project owner can manage
    const canManage = isProjectAdmin || isProjectOwner || isOrgOwner || isOrgAdmin;

    return {
        canCreateTask: canEdit,
        canEditTask: canEdit,
        canDeleteTask: canEdit,
        canAssignTask: canEdit,
        canUpdateTaskStatus: canEdit,
        canManageWorkflow: canManage,
        canEditProjectSettings: canManage,
        canAddMembers: canManage,
        canRemoveMembers: canManage,
    };
}

/**
 * React hook for organization permissions
 * Requires user, org, and role context
 */
export function useOrgPermissions(
    userId: string | undefined,
    org: { ownerId?: string | null } | null | undefined,
    orgRole: OrgRole | undefined
): OrgPermissions {
    if (!userId || !orgRole) {
        // Return all-false permissions if not authenticated
        return {
            canInviteToOrg: false,
            canResendInvite: false,
            canUpdateMemberRole: false,
            canCreateProject: false,
            canAddToProject: false,
            canUpdateOrgSettings: false,
            canDeleteOrg: false,
            canDeleteProject: () => false,
            canEditProject: () => false,
            canWorkOnTasks: false,
        };
    }

    return getOrgPermissions(userId, org ?? null, orgRole);
}

/**
 * React hook for project permissions
 */
export function useProjectPermissions(
    userId: string | undefined,
    project: { ownerId?: string | null } | null | undefined,
    projectRole: ProjectRole | undefined,
    orgRole: OrgRole | undefined
): ProjectPermissions {
    if (!userId || !projectRole || !orgRole) {
        // Return all-false permissions if not authenticated
        return {
            canCreateTask: false,
            canEditTask: false,
            canDeleteTask: false,
            canAssignTask: false,
            canUpdateTaskStatus: false,
            canManageWorkflow: false,
            canEditProjectSettings: false,
            canAddMembers: false,
            canRemoveMembers: false,
        };
    }

    return getProjectPermissions(userId, project ?? null, projectRole, orgRole);
}

/**
 * Helper: Check if user is org creator
 */
export function isOrgCreator(userId: string | undefined, org: { ownerId?: string | null } | null | undefined): boolean {
    return !!userId && !!org && org.ownerId === userId;
}

/**
 * Helper: Check if user is project owner
 */
export function isProjectOwner(userId: string | undefined, project: { ownerId?: string | null } | null | undefined): boolean {
    return !!userId && !!project && project.ownerId === userId;
}
