/**
 * Project API Types
 */

export interface Tag {
    id: string;
    orgId: string;
    name: string;
    color: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
    id: string;
    projectId: string; // Human-readable ID (e.g., PR-1)
    name: string;
    description: string | null;
    color: string | null;
    startDate: string | null;
    endDate: string | null;
    access: 'PRIVATE' | 'PUBLIC';
    status: ProjectStatus;
    ownerId: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    joinedAt?: string;
    createdAt: string;
    updatedAt?: string;
    isArchived?: boolean;
    tags: Tag[];
    orgId?: string;
}

export interface CreateProjectPayload {
    name: string;
    description?: string;
    color: string;
    startDate?: string;
    endDate?: string;
    access: 'PRIVATE' | 'PUBLIC';
    status?: ProjectStatus;
    ownerId?: string;
    tags?: Array<{ name: string; color: string }>;
    orgId?: string;
}

export interface UpdateProjectPayload {
    name?: string;
    description?: string;
    color?: string;
    startDate?: string;
    endDate?: string;
    access?: 'PRIVATE' | 'PUBLIC';
    status?: ProjectStatus;
    tags?: Array<{ name: string; color: string }>;
}

export interface ProjectResponse {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    color: string | null;
    startDate: string | null;
    endDate: string | null;
    access: 'PRIVATE' | 'PUBLIC';
    status: ProjectStatus;
    ownerId: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    joinedAt?: string;
    createdAt: string;
    updatedAt?: string;
    isArchived?: boolean;
    tags: Tag[];
    orgId?: string;
}
