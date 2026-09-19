/**
 * Issue Types — Teslead Connect
 * Separate from Task types but shares TaskStatus workflow, Tag, Phase, TaskList, User
 */

export type IssueType = 'BUG' | 'UI' | 'LOGIC' | 'PERFORMANCE' | 'SECURITY' | 'OTHER';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssuePriority = 1 | 2 | 3 | 4 | 5;

export interface IssueStatus {
    id: string;
    name: string;
    color: string;
    stageId?: string;
    stageName?: string;
}

export interface IssueAssignee {
    assignedAt: string;
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface IssueTag {
    id: string;
    name: string;
    color: string;
}

export interface IssueAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
    uploadedById?: string;
    createdAt: string;
}

export interface IssueStatusHistoryEntry {
    changedAt: string;
    user: { id: string; name: string; avatarUrl?: string };
    status: { id: string; name: string; color: string };
}

export interface LinkedTask {
    id: string;
    title: string;
    taskId?: string | null;
}

export interface SubIssue {
    id: string;
    issueId?: string | null;
    title: string;
    type?: IssueType | null;
    severity?: IssueSeverity | null;
    priority: number;
    status: { id: string; name: string; color: string };
}

export interface Issue {
    id: string;
    issueId?: string | null;
    title: string;
    description?: string;
    expectedOutput?: string;
    actualOutput?: string;
    type?: IssueType | null;
    severity?: IssueSeverity | null;
    priority: number;
    order: number;
    dueDate: string | null;
    startDate: string | null;
    completionPercentage: number;
    parentIssueId?: string | null;
    projectId: string;
    projectName: string;
    projectColor: string | null;
    phaseId?: string | null;
    phaseName?: string | null;
    taskListId?: string | null;
    taskListName?: string | null;
    taskId?: string | null;
    linkedTask?: LinkedTask | null;
    status: IssueStatus;
    assignees: IssueAssignee[];
    tags: IssueTag[];
    attachments: IssueAttachment[];
    statusHistory?: IssueStatusHistoryEntry[];
    subIssues?: SubIssue[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateIssuePayload {
    title: string;
    description?: string;
    expectedOutput?: string;
    actualOutput?: string;
    type?: IssueType;
    severity?: IssueSeverity;
    priority?: IssuePriority;
    statusId?: string;
    phaseId?: string | null;
    taskListId?: string | null;
    taskId?: string | null;
    parentIssueId?: string | null;
    dueDate?: string;
    startDate?: string;
    assigneeIds?: string[];
    tagIds?: string[];
    attachments?: Array<{ fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }>;
    completionPercentage?: number;
}

export interface UpdateIssuePayload {
    title?: string;
    description?: string;
    expectedOutput?: string;
    actualOutput?: string;
    type?: IssueType;
    severity?: IssueSeverity;
    priority?: IssuePriority;
    statusId?: string;
    phaseId?: string | null;
    taskListId?: string | null;
    taskId?: string | null;
    parentIssueId?: string | null;
    dueDate?: string;
    startDate?: string;
    assigneeIds?: string[];
    tagIds?: string[];
    attachments?: Array<{ fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }>;
    completionPercentage?: number;
}

export interface MyIssuesMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MyIssuesResponse {
    data: Issue[];
    meta: MyIssuesMeta;
}
