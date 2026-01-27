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
    ProjectMember,
} from '@/types/project';
import { API_CONFIG } from '@/lib/config';

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
    async getAllProjects(params?: { orgId?: string; email?: string; page?: number; limit?: number }): Promise<Project[]> {
        // If orgId is explicitly 'all' or empty, use the dedicated /projects/all endpoint
        if (params?.orgId === 'all') {
            const { data } = await apiClient.get<{ data: Project[] }>(API_CONFIG.ENDPOINTS.PROJECTS.ALL);
            return data.data;
        }

        const orgId = params?.orgId || getOrgId();

        // Build query params
        const queryParams: Record<string, any> = {};
        if (params?.orgId && params.orgId !== 'all') {
            queryParams.orgId = params.orgId;
        }
        if (params?.page) queryParams.page = params.page;
        if (params?.limit) queryParams.limit = params.limit;

        const { data } = await apiClient.get<{ data: Project[] }>('/projects', {
            headers: {
                'x-org-id': orgId,
            },
            params: queryParams
        });

        return data.data; // API returns enveloped response
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
        const { orgId, ...restPayload } = payload;
        const targetOrgId = orgId || getOrgId();
        const { data } = await apiClient.post<ProjectResponse>('/projects', restPayload, {
            headers: {
                'x-org-id': targetOrgId,
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

    /**
     * Get project members
     */
    async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`, {
            headers: {
                'x-org-id': orgId,
            },
        });
        return data || [];
    },
};
