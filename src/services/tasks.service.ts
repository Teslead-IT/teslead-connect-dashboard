import { apiClient } from '@/lib/api-client';
import type {
    WorkflowStage,
    Task,
    CreateTaskPayload,
    UpdateTaskPayload,
    UpdateTaskStatusPayload,
    TasksResponse,
    TaskResponse,
} from '@/types/task';

/**
 * Workflow Service
 */
export const workflowService = {
    /**
     * Get workflow for a project
     * @param projectId - Project ID
     * @returns Workflow stages with statuses
     */
    async getWorkflow(projectId: string): Promise<WorkflowStage[]> {
        const response = await apiClient.get<WorkflowStage[]>(`/projects/${projectId}/workflow`);
        return response.data;
    },
};

/**
 * Task Service
 */
export const taskService = {
    /**
     * Get all tasks for a project
     * @param projectId - Project ID
     * @returns List of tasks
     */
    async getTasks(projectId: string): Promise<Task[]> {
        const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
        return response.data;
    },

    /**
     * Create a new task
     * @param projectId - Project ID
     * @param payload - Task creation data
     * @returns Created task
     */
    async createTask(projectId: string, payload: CreateTaskPayload): Promise<TaskResponse> {
        const response = await apiClient.post<TaskResponse>(`/projects/${projectId}/tasks`, payload);
        return response.data;
    },

    /**
     * Update a task
     * @param taskId - Task ID
     * @param payload - Task update data
     * @returns Updated task
     */
    async updateTask(taskId: string, payload: UpdateTaskPayload): Promise<TaskResponse> {
        const response = await apiClient.patch<TaskResponse>(`/tasks/${taskId}`, payload);
        return response.data;
    },

    /**
     * Update task status
     * @param taskId - Task ID
     * @param payload - Status update data
     * @returns Updated task
     */
    async updateTaskStatus(taskId: string, payload: UpdateTaskStatusPayload): Promise<TaskResponse> {
        const response = await apiClient.patch<TaskResponse>(`/tasks/${taskId}/status`, payload);
        return response.data;
    },

    /**
     * Delete a task
     * @param taskId - Task ID
     */
    async deleteTask(taskId: string): Promise<void> {
        await apiClient.delete(`/tasks/${taskId}`);
    },
};
