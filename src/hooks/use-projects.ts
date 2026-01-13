
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/projects.service';
import type { CreateProjectPayload, UpdateProjectPayload } from '@/types/project';

export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
    return useQuery({
        queryKey: projectKeys.all,
        queryFn: projectsApi.getAllProjects,
    });
}

export function useProject(projectId: string) {
    return useQuery({
        queryKey: projectKeys.detail(projectId),
        queryFn: () => projectsApi.getProjectById(projectId),
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectPayload) => projectsApi.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProjectPayload }) =>
            projectsApi.updateProject(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => projectsApi.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
