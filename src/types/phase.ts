export interface Phase {
    id: string;
    name: string;
    projectId: string;
    startDate: string | null;
    endDate: string | null;
    access: 'PUBLIC' | 'PRIVATE';
    orderIndex: number;
    status?: {
        id: string;
        name: string;
        color: string;
    } | null;
    completionPercentage?: number;
    tags?: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    assignees?: Array<{
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface TaskList {
    id: string;
    name: string;
    projectId: string;
    phaseId: string | null;
    access: 'PUBLIC' | 'PRIVATE';
    orderIndex: number;
    tags?: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface PhaseWithTaskLists extends Phase {
    taskLists: TaskListWithTasks[];
}

export interface TaskListWithTasks extends TaskList {
    tasks: StructuredTask[];
}

export interface StructuredTask {
    id: string;
    title: string;
    description?: string;
    priority: number;
    order: number;
    dueDate: string | null;
    startDate: string | null;
    completionPercentage: number;
    parentId: string | null;
    status: {
        id: string;
        name: string;
        color: string;
    };
    assignees: Array<{
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    }>;
    tags: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    children?: StructuredTask[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePhasePayload {
    projectId: string;
    name: string;
    startDate?: string;
    endDate?: string;
    access?: 'PUBLIC' | 'PRIVATE';
    statusId?: string;
    completionPercentage?: number;
    tagIds?: string[];
    assigneeIds?: string[];
}

export interface UpdatePhasePayload {
    name?: string;
    startDate?: string;
    endDate?: string;
    access?: 'PUBLIC' | 'PRIVATE';
    statusId?: string;
    completionPercentage?: number;
    tagIds?: string[];
    assigneeIds?: string[];
}

export interface CreateTaskListPayload {
    projectId: string;
    phaseId: string;
    name: string;
    access?: 'PUBLIC' | 'PRIVATE';
    tagIds?: string[];
}

export interface UpdateTaskListPayload {
    name?: string;
    access?: 'PUBLIC' | 'PRIVATE';
    tagIds?: string[];
}

export interface ReorderPayload {
    orderedIds: string[];
}

export interface MoveTaskPayload {
    newTaskListId?: string;
    newPhaseId?: string;
    newOrderIndex: number;
}
