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
    parentId?: string | null;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeIds?: string[];
    statusId: string;
    taskListId?: string;
    phaseId?: string;
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
