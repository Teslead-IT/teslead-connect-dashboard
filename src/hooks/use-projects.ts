import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/projects.service';

export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    members: (id: string) => ['projects', id, 'members'] as const,
};

export function useProjectMembers(projectId: string) {
    return useQuery({
        queryKey: projectKeys.members(projectId),
        queryFn: () => projectsApi.getProjectMembers(projectId),
        enabled: !!projectId,
    });
}

export function useProjects(params?: { orgId?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: [...projectKeys.all, params?.orgId || 'all', params?.page, params?.limit],
        queryFn: () => projectsApi.getAllProjects(params),
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
        mutationFn: projectsApi.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.updateProject(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectsApi.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
