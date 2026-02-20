import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phaseService } from '@/services/phases.service';
import type {
    CreatePhasePayload,
    UpdatePhasePayload,
    CreateTaskListPayload,
    UpdateTaskListPayload,
    ReorderPayload,
    MoveTaskPayload,
} from '@/types/phase';

export const phaseKeys = {
    structured: (projectId: string) => ['phases', 'structured', projectId] as const,
};

export function useStructuredPhases(projectId: string) {
    return useQuery({
        queryKey: phaseKeys.structured(projectId),
        queryFn: () => phaseService.getStructuredData(projectId),
        enabled: !!projectId,
    });
}

export function useCreatePhase(projectId?: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePhasePayload) => phaseService.createPhase(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: phaseKeys.structured(variables.projectId) });
            if (projectId && projectId !== variables.projectId) {
                qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) });
            }
        },
    });
}

export function useUpdatePhase(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ phaseId, data }: { phaseId: string; data: UpdatePhasePayload }) =>
            phaseService.updatePhase(phaseId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useDeletePhase(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (phaseId: string) => phaseService.deletePhase(phaseId),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useReorderPhases(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ReorderPayload) => phaseService.reorderPhases(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useCreateTaskList(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTaskListPayload) => phaseService.createTaskList(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useUpdateTaskList(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskListId, data }: { taskListId: string; data: UpdateTaskListPayload }) =>
            phaseService.updateTaskList(taskListId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useDeleteTaskList(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (taskListId: string) => phaseService.deleteTaskList(taskListId),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useReorderTaskLists(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ReorderPayload) => phaseService.reorderTaskLists(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}

export function useMoveTask(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: string; data: MoveTaskPayload }) =>
            phaseService.moveTask(taskId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.structured(projectId) }),
    });
}
