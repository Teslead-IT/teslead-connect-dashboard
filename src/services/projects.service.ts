/**
 * Projects API Service
 * All project-related API calls are centralized here
 */

import { apiClient } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import type {
    Project,
    CreateProjectPayload,
    UpdateProjectPayload,
    ProjectResponse,
} from '@/types/project';

/**
 * Get Organization ID from stored user data
 * Falls back to a default if not available
 */
function getOrgId(): string {
    const user = tokenStorage.getUser();
    // Assuming the user object has orgId or organizations array
    return user?.orgId || user?.organizations?.[0]?.id || '';
}

export const projectsApi = {
    /**
     * Get all projects for the current organization
     */
    async getAllProjects(): Promise<Project[]> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<Project[]>('/projects', {
            headers: {
                'x-org-id': orgId,
            },
        });
        return data;
    },

    /**
     * Get a single project by ID
     */
    async getProjectById(projectId: string): Promise<ProjectResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<ProjectResponse>(`/projects/${projectId}`, {
            headers: {
                'x-org-id': orgId,
            },
        });
        return data;
    },

    /**
     * Create a new project
     */
    async createProject(payload: CreateProjectPayload): Promise<ProjectResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.post<ProjectResponse>('/projects', payload, {
            headers: {
                'x-org-id': orgId,
            },
        });
        return data;
    },

    /**
     * Update an existing project
     */
    async updateProject(projectId: string, payload: UpdateProjectPayload): Promise<ProjectResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.patch<ProjectResponse>(`/projects/${projectId}`, payload, {
            headers: {
                'x-org-id': orgId,
            },
        });
        return data;
    },

    /**
     * Delete a project
     */
    async deleteProject(projectId: string): Promise<void> {
        const orgId = getOrgId();
        await apiClient.delete(`/projects/${projectId}`, {
            headers: {
                'x-org-id': orgId,
            },
        });
    },

    /**
     * Archive a project
     */
    async archiveProject(projectId: string): Promise<ProjectResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.patch<ProjectResponse>(
            `/projects/${projectId}`,
            { isArchived: true },
            {
                headers: {
                    'x-org-id': orgId,
                },
            }
        );
        return data;
    },

    // Convenience aliases
    getProject: (projectId: string) => projectsApi.getProjectById(projectId),
    getProjects: () => projectsApi.getAllProjects(),
};
