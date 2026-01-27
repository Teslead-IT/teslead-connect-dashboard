/**
 * Invitation System Types
 * Based on the backend API specification
 */

// ============= Enums =============

export enum OrgRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export enum ProjectRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    VIEWER = 'VIEWER'
}

export enum MemberStatus {
    INVITED = 'INVITED',
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED'
}

export enum NotificationType {
    INVITE_RECEIVED = 'INVITE_RECEIVED',
    INVITE_ACCEPTED = 'INVITE_ACCEPTED',
    INVITE_REJECTED = 'INVITE_REJECTED',
    INVITE_EXPIRED = 'INVITE_EXPIRED',
    TASK_ASSIGNED = 'TASK_ASSIGNED'
}

// ============= Request DTOs =============

export interface SendInviteDto {
    email: string;
    orgRole: OrgRole;
    id?: string;
    projectId?: string;
    projectRole?: ProjectRole;
}

export interface AcceptInviteDto {
    inviteToken: string;
}

export interface RejectInviteDto {
    inviteToken: string;
}

export interface ResendInviteDto {
    email: string;
}

// ============= Response Types =============

export interface InviteResponse {
    message: string;
    email: string;
    orgRole: OrgRole;
    projectId: string | null;
    projectRole: ProjectRole | null;
    expiresAt: string;
}

export interface PendingInvite {
    id: string;
    email: string;
    role: OrgRole;
    status: MemberStatus;
    inviteToken: string;
    expiresAt: string;
    org: {
        id: string;
        name: string;
        slug: string;
    };
    project?: {
        id: string;
        name: string;
    };
}

export interface AcceptInviteResponse {
    message: string;
    organization: {
        id: string;
        name: string;
        role: OrgRole;
    };
    project?: {
        id: string;
        name: string;
        role: ProjectRole;
    };
}

export interface RejectInviteResponse {
    message: string;
    organizationName: string;
}

export interface ResendInviteResponse {
    message: string;
    email: string;
    expiresAt: string;
}

// ============= Notification Types =============

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    organizationId: string | null;
    projectId?: string | null;
    createdAt: string;
    read?: boolean;
    readAt?: string | null;
    metadata?: any;
}

export interface NotificationResponse {
    data: Notification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ============= Error Types =============

export interface InviteError {
    statusCode: number;
    message: string;
    error?: string;
}
