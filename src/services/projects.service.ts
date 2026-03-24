/**
 * Projects API Service
 * All project-related API calls centralized here.
 * Tenant context (x-org-id) is attached by api-client interceptor from org store.
 */

import { apiClient } from '@/lib/api-client';
import type {
    Project,
    CreateProjectPayload,
    UpdateProjectPayload,
    ProjectResponse,
    ProjectMember,
    PaginatedProjectsResponse,
} from '@/types/project';
import { API_CONFIG } from '@/lib/config';

export const projectsApi = {
    /**
     * Get all projects for the current organization (org from header)
     */
    async getAllProjects(params?: { email?: string; page?: number; limit?: number }): Promise<PaginatedProjectsResponse> {
        const queryParams: Record<string, any> = {};
        if (params?.page) queryParams.page = params.page;
        if (params?.limit) queryParams.limit = params.limit;

        const { data } = await apiClient.get<PaginatedProjectsResponse>('/projects', {
            params: queryParams
        });

        if (Array.isArray(data)) {
            return {
                data: data,
                meta: {
                    total: (data as Project[]).length,
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };
        }

        return data;
    },

    /**
     * Get a single project by ID
     */
    async getProjectById(projectId: string): Promise<ProjectResponse> {
        const { data } = await apiClient.get<ProjectResponse>(`/projects/${projectId}`);
        return data;
    },

    /**
     * Create a new project (org from header)
     */
    async createProject(payload: CreateProjectPayload): Promise<ProjectResponse> {
        const { orgId: _omit, ...restPayload } = payload;
        const { data } = await apiClient.post<ProjectResponse>('/projects', restPayload);
        return data;
    },

    /**
     * Update an existing project
     */
    async updateProject(projectId: string, payload: UpdateProjectPayload): Promise<ProjectResponse> {
        const { data } = await apiClient.patch<ProjectResponse>(`/projects/${projectId}`, payload);
        return data;
    },

    /**
     * Delete a project
     */
    async deleteProject(projectId: string): Promise<void> {
        await apiClient.delete(`/projects/${projectId}`);
    },

    /**
     * Archive a project
     */
    async archiveProject(projectId: string): Promise<ProjectResponse> {
        const { data } = await apiClient.patch<ProjectResponse>(
            `/projects/${projectId}`,
            { isArchived: true }
        );
        return data;
    },

    getProject: (projectId: string) => projectsApi.getProjectById(projectId),
    getProjects: () => projectsApi.getAllProjects(),

    /**
     * Get project members
     */
    async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
        const { data } = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
        return data || [];
    },
};
