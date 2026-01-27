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

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

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
    title: string;
    description?: string;
    parentId: string | null;
    priority: TaskPriority;
    dueDate: string | null;
    assigneeIds: string[];
    assignees?: TaskAssignee[];
    status: TaskStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    parentId?: string | null; // For subtasks
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    statusId: string; // Required - must be valid from workflow
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    statusId?: string;
    parentId?: string | null;
}

export interface TaskResponse extends Task { }

export interface TasksResponse {
    tasks: Task[];
    total: number;
}
