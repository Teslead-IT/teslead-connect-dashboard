/**
 * Workflow & Task Types
 */

export interface Status {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
}

export interface WorkflowStage {
    id: string;
    name: string;
    statuses: Status[];
}

export interface CreateStatusDto {
    stageId: string;
    name: string;
    color?: string;
    isDefault?: boolean;
}

export interface StatusResponse extends Status { }

export type TaskPriority = 1 | 2 | 3 | 4 | 5;
export type TaskType = 'FEAT' | 'BUG' | 'IMPR' | 'REF' | 'RND' | 'DOC' | 'OPS' | 'TEST' | 'HOT';

export interface TaskStatus {
    id: string;
    name: string;
    stageName: string;
}

export interface TaskAssignee {
    assignmentId?: string;
    id: string; // usually assignment id
    userId: string;
    taskId: string;
    name?: string;
    email?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
}

export interface Task {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    parentId: string | null;
    priority: TaskPriority;
    dueDate: string | null;
    assigneeIds: string[];
    assignees?: TaskAssignee[];
    status: TaskStatus;
    type: TaskType;
    startDate: string | null;
    completionPercentage: number;
    tags?: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    parentId?: string | null;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    statusId: string;
    type?: TaskType;
    taskListId?: string;
    phaseId?: string;
    startDate?: string;
    completionPercentage?: number;
    tagIds?: string[];
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    statusId?: string;
    type?: TaskType;
    parentId?: string | null;
    startDate?: string;
    completionPercentage?: number;
    tagIds?: string[];
}

export interface TaskResponse extends Task { }

export interface TasksResponse {
    tasks: Task[];
    total: number;
}

/** My Tasks API response - GET /tasks/my-tasks */
export interface MyTaskAssignee {
    assignedAt: string;
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface MyTaskTag {
    id: string;
    name: string;
    color: string;
}

export interface MyTaskStatus {
    id: string;
    name: string;
    color: string;
    stageId: string;
    stageName: string;
}

export interface MyTask {
    id: string;
    title: string;
    description?: string;
    priority: number;
    order: number;
    dueDate: string | null;
    parentId: string | null;
    projectId: string;
    projectName: string;
    projectColor: string | null;
    status: MyTaskStatus;
    assignees: MyTaskAssignee[];
    tags: MyTaskTag[];
    startDate: string | null;
    completionPercentage: number;
    createdAt: string;
    updatedAt: string;
}

export interface MyTasksMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MyTasksResponse {
    data: MyTask[];
    meta: MyTasksMeta;
}
