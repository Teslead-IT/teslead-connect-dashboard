
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, workflowService } from '@/services/tasks.service';
import type { CreateTaskPayload, UpdateTaskPayload } from '@/types/task';

export const taskKeys = {
    all: (projectId: string) => ['tasks', projectId] as const,
    workflow: (projectId: string) => ['workflow', projectId] as const,
};

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

export function useCreateTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskPayload) => taskService.createTask(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
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
        },
    });
}



export function useDeleteTask(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: string) => taskService.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
        },
    });
}
