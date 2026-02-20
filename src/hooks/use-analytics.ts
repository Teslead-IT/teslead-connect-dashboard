import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import type { TaskListBucket } from '@/types/analytics';

export const analyticsKeys = {
    dashboard: (orgId: string | undefined) => ['analytics', 'dashboard', orgId] as const,
    dashboardMine: (orgId: string | undefined) => ['analytics', 'dashboard', 'mine', orgId] as const,
    taskLists: (orgId: string | undefined, bucket: string, limit: number) =>
        ['analytics', 'task-lists', orgId, bucket, limit] as const,
    taskListsMine: (orgId: string | undefined, bucket: string, limit: number) =>
        ['analytics', 'task-lists', 'mine', orgId, bucket, limit] as const,
    users: (orgId: string | undefined) => ['analytics', 'users', orgId] as const,
};

export function useDashboard(orgId: string | undefined) {
    return useQuery({
        queryKey: analyticsKeys.dashboard(orgId),
        queryFn: () => analyticsService.getDashboard(orgId),
        enabled: !!orgId,
    });
}

export function useDashboardMine(orgId: string | undefined) {
    return useQuery({
        queryKey: analyticsKeys.dashboardMine(orgId),
        queryFn: () => analyticsService.getDashboardMine(orgId),
        enabled: !!orgId,
    });
}

export function useTaskLists(
    orgId: string | undefined,
    options: { bucket?: TaskListBucket; limit?: number } = {}
) {
    const { bucket = 'all', limit = 20 } = options;
    return useQuery({
        queryKey: analyticsKeys.taskLists(orgId, bucket, limit),
        queryFn: () => analyticsService.getTaskLists({ bucket, limit }, orgId),
        enabled: !!orgId,
    });
}

export function useTaskListsMine(
    orgId: string | undefined,
    options: { bucket?: TaskListBucket; limit?: number } = {}
) {
    const { bucket = 'all', limit = 20 } = options;
    return useQuery({
        queryKey: analyticsKeys.taskListsMine(orgId, bucket, limit),
        queryFn: () => analyticsService.getTaskListsMine({ bucket, limit }, orgId),
        enabled: !!orgId,
    });
}

export function useDashboardUsers(orgId: string | undefined) {
    return useQuery({
        queryKey: analyticsKeys.users(orgId),
        queryFn: () => analyticsService.getDashboardUsers(orgId),
        enabled: !!orgId,
    });
}
