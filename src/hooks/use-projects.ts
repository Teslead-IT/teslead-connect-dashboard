import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/projects.service';
import { useOrgStore } from '@/stores/orgStore';

export const projectKeys = {
    all: (orgId: string | null) => ['projects', orgId] as const,
    detail: (orgId: string | null, id: string) => ['projects', orgId, id] as const,
    members: (orgId: string | null, id: string) => ['projects', orgId, id, 'members'] as const,
};

export function useProjectMembers(projectId: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: projectKeys.members(activeOrgId, projectId),
        queryFn: () => projectsApi.getProjectMembers(projectId),
        enabled: !!projectId && activeOrgId !== null,
    });
}

export function useProjects(params?: { page?: number; limit?: number }) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: [...projectKeys.all(activeOrgId), params?.page, params?.limit],
        queryFn: () => projectsApi.getAllProjects(params),
        enabled: activeOrgId !== null,
    });
}

export function useProject(projectId: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: projectKeys.detail(activeOrgId, projectId),
        queryFn: () => projectsApi.getProjectById(projectId),
        enabled: !!projectId && activeOrgId !== null,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useMutation({
        mutationFn: projectsApi.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all(activeOrgId) });
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.updateProject(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all(activeOrgId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(activeOrgId, data.id) });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useMutation({
        mutationFn: projectsApi.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all(activeOrgId) });
        },
    });
}
