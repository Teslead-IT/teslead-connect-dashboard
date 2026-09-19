import { apiClient } from '@/lib/api-client';
import type {
    Issue,
    CreateIssuePayload,
    UpdateIssuePayload,
    MyIssuesResponse,
} from '@/types/issue';

/**
 * Issue Service — Teslead Connect
 */
export const issueService = {
    /**
     * Get all issues for a project
     */
    async getProjectIssues(projectId: string): Promise<Issue[]> {
        const response = await apiClient.get<Issue[]>(`/projects/${projectId}/issues`);
        return response.data;
    },

    /**
     * Create a new issue in a project
     */
    async createIssue(projectId: string, payload: CreateIssuePayload): Promise<Issue> {
        const response = await apiClient.post<Issue>(`/projects/${projectId}/issues`, payload);
        return response.data;
    },

    /**
     * Get a single issue by ID
     */
    async getIssueById(issueId: string): Promise<Issue> {
        const response = await apiClient.get<Issue>(`/issues/${issueId}`);
        return response.data;
    },

    /**
     * Update an issue
     */
    async updateIssue(issueId: string, payload: UpdateIssuePayload): Promise<Issue> {
        const response = await apiClient.patch<Issue>(`/issues/${issueId}`, payload);
        return response.data;
    },

    /**
     * Delete an issue
     */
    async deleteIssue(issueId: string): Promise<void> {
        await apiClient.delete(`/issues/${issueId}`);
    },

    /**
     * Add assignee to issue
     */
    async addAssignee(issueId: string, userId: string): Promise<Issue> {
        const response = await apiClient.post<Issue>(`/issues/${issueId}/assignees`, { userId });
        return response.data;
    },

    /**
     * Remove assignee from issue
     */
    async removeAssignee(issueId: string, userId: string): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/issues/${issueId}/assignees/${userId}`);
        return response.data;
    },

    /**
     * Get issues assigned to current user (My Issues - paginated)
     */
    async getMyIssues(params?: {
        page?: number;
        limit?: number;
        search?: string;
        statusId?: string;
        projectId?: string;
    }): Promise<MyIssuesResponse> {
        const response = await apiClient.get<MyIssuesResponse>('/issues/my-issues', { params });
        return response.data;
    },

    /**
     * Add attachment to issue
     */
    async addAttachment(issueId: string, payload: { fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }) {
        const response = await apiClient.post(`/issues/${issueId}/attachments`, payload);
        return response.data;
    },

    /**
     * Remove attachment from issue
     */
    async removeAttachment(issueId: string, attachmentId: string) {
        const response = await apiClient.delete(`/issues/${issueId}/attachments/${attachmentId}`);
        return response.data;
    },
};
