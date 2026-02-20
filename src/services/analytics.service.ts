/**
 * Analytics API Service
 * Org-level and user-level dashboard, task lists, and users.
 * @see ANALYTICS_API.md
 */

import { apiClient } from '@/lib/api-client';
import type {
    DashboardResponse,
    MineDashboardResponse,
    TaskListResponse,
    DashboardUsersResponse,
    TaskListBucket,
} from '@/types/analytics';

function headers(orgId: string | undefined) {
    const h: Record<string, string> = {};
    if (orgId) h['x-org-id'] = orgId;
    return h;
}

export const analyticsService = {
    async getDashboard(orgId?: string): Promise<DashboardResponse> {
        const { data } = await apiClient.get<DashboardResponse>('/analytics/dashboard', {
            headers: headers(orgId),
        });
        return data;
    },

    async getDashboardMine(orgId?: string): Promise<MineDashboardResponse> {
        const { data } = await apiClient.get<MineDashboardResponse>('/analytics/dashboard/mine', {
            headers: headers(orgId),
        });
        return data;
    },

    async getTaskLists(
        params: { bucket?: TaskListBucket; limit?: number },
        orgId?: string
    ): Promise<TaskListResponse> {
        const { data } = await apiClient.get<TaskListResponse>('/analytics/dashboard/task-lists', {
            params: {
                bucket: params.bucket ?? 'all',
                limit: params.limit ?? 20,
            },
            headers: headers(orgId),
        });
        return data;
    },

    async getTaskListsMine(
        params: { bucket?: TaskListBucket; limit?: number },
        orgId?: string
    ): Promise<TaskListResponse> {
        const { data } = await apiClient.get<TaskListResponse>('/analytics/dashboard/mine/task-lists', {
            params: {
                bucket: params.bucket ?? 'all',
                limit: params.limit ?? 20,
            },
            headers: headers(orgId),
        });
        return data;
    },

    async getDashboardUsers(orgId?: string): Promise<DashboardUsersResponse> {
        const { data } = await apiClient.get<DashboardUsersResponse>('/analytics/dashboard/users', {
            headers: headers(orgId),
        });
        return data;
    },
};
