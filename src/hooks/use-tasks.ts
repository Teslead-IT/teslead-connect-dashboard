
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, workflowService } from '@/services/tasks.service';
import type { CreateTaskPayload, UpdateTaskPayload, CreateStatusDto } from '@/types/task';

export const taskKeys = {
    all: (projectId: string) => ['tasks', projectId] as const,
    workflow: (projectId: string) => ['workflow', projectId] as const,
    myTasks: (page?: number, limit?: number) => ['tasks', 'my-tasks', page, limit] as const,
};

export function useMyTasks(params?: { page?: number; limit?: number; search?: string; statusId?: string; projectId?: string }) {
    return useQuery({
        queryKey: ['tasks', 'my-tasks', params?.page, params?.limit, params?.search, params?.statusId, params?.projectId],
        queryFn: () => taskService.getMyTasks(params),
        placeholderData: (previousData) => previousData,
    });
}

export function useUserTasks(
    userId: string,
    params?: { page?: number; limit?: number; search?: string; statusId?: string; projectId?: string }
) {
    return useQuery({
        queryKey: ['tasks', 'user-tasks', userId, params?.page, params?.limit, params?.search, params?.statusId, params?.projectId],
        queryFn: () => taskService.getUserTasks(userId, params),
        enabled: !!userId,
        placeholderData: (previousData) => previousData,
    });
}

export function useProjectTasks(projectId: string) {
    return useQuery({
        queryKey: taskKeys.all(projectId),
        queryFn: () => taskService.getTasks(projectId),
        enabled: !!projectId,
    });
}

export function useProjectWorkflow(projectId: string) {
    return useQuery({
        queryKey: taskKeys.workflow(projectId),
        queryFn: () => workflowService.getWorkflow(projectId),
        enabled: !!projectId,
    });
}

export function useCreateStatus(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateStatusDto) => workflowService.createStatus(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.workflow(projectId) });
        },
    });
}

export function useCreateTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskPayload) => taskService.createTask(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: ['phases', 'structured', projectId] });
        },
    });
}

export function useUpdateTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }) =>
            taskService.updateTask(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: taskKeys.myTasks() });
            queryClient.invalidateQueries({ queryKey: ['phases', 'structured', projectId] });
        },
    });
}



export function useDeleteTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: string) => taskService.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: ['phases', 'structured', projectId] });
        },
    });
}

export function useRevokeAssignee(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
            taskService.removeAssignee(taskId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
        },
    });
}
