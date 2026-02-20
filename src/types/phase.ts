export interface Phase {
    id: string;
    name: string;
    projectId: string;
    startDate: string | null;
    endDate: string | null;
    access: 'PUBLIC' | 'PRIVATE';
    orderIndex: number;
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
}

export interface UpdatePhasePayload {
    name?: string;
    startDate?: string;
    endDate?: string;
    access?: 'PUBLIC' | 'PRIVATE';
}

export interface CreateTaskListPayload {
    projectId: string;
    phaseId: string;
    name: string;
    access?: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateTaskListPayload {
    name?: string;
    access?: 'PUBLIC' | 'PRIVATE';
}

export interface ReorderPayload {
    orderedIds: string[];
}

export interface MoveTaskPayload {
    newTaskListId?: string;
    newPhaseId?: string;
    newOrderIndex: number;
}
