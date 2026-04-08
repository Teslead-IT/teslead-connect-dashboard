import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';

export interface TrendMetric {
    value: number;
    trend: number;
}

export interface WorkloadActivityItem {
    period: string; // ISO Date String
    value: number;
}

export interface PriorityDistributionItem {
    label: string;
    value: number;
}

export interface ProjectPulseItem {
    id: string;
    name: string;
    taskCount: number;
    completedTasks: number;
    completionPercentage: number;
}

export interface DashboardMetricsDto {
    completedTasks: TrendMetric;
    inProgressTasks: TrendMetric;
    efficiency: TrendMetric;
    capacity: TrendMetric;
    workloadActivity: WorkloadActivityItem[];
    priorityDistribution: PriorityDistributionItem[];
    projectPulse: ProjectPulseItem[];
}

export const analyticsApi = {
    /**
     * Fetch the aggregated dashboard metrics for the entire organization
     */
    getOrgProductivity: async (): Promise<DashboardMetricsDto> => {
        const { data } = await apiClient.get<DashboardMetricsDto>(API_CONFIG.ENDPOINTS.ANALYTICS.ORG_PRODUCTIVITY);
        return data;
    },

    /**
     * Fetch the user's specific dashboard metrics
     */
    getMyProductivity: async (): Promise<DashboardMetricsDto> => {
        const { data } = await apiClient.get<DashboardMetricsDto>(API_CONFIG.ENDPOINTS.ANALYTICS.MY_PRODUCTIVITY);
        return data;
    },

    /**
     * Fetch the dashboard metrics for a specific user (admin/owner only)
     */
    getUserProductivity: async (userId: string): Promise<DashboardMetricsDto> => {
        const { data } = await apiClient.get<DashboardMetricsDto>(API_CONFIG.ENDPOINTS.ANALYTICS.USER_PRODUCTIVITY(userId));
        return data;
    },
};
