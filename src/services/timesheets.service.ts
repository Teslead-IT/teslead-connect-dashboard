/**
 * Timesheets API. Tenant context via x-org-id header.
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { Timesheet } from '@/types/time-entry';

export const timesheetsApi = {
    async getMy(params?: { weekStart?: string }): Promise<Timesheet[]> {
        const { data } = await apiClient.get<Timesheet[]>(API_CONFIG.ENDPOINTS.TIMESHEETS.MY, { params });
        return Array.isArray(data) ? data : [];
    },

    async getTeam(params?: { weekStart?: string }): Promise<Timesheet[]> {
        const { data } = await apiClient.get<Timesheet[]>(API_CONFIG.ENDPOINTS.TIMESHEETS.TEAM, { params });
        return Array.isArray(data) ? data : [];
    },

    async submit(payload: { weekStart: string }): Promise<Timesheet> {
        const { data } = await apiClient.post<Timesheet>(API_CONFIG.ENDPOINTS.TIMESHEETS.SUBMIT, payload);
        return data;
    },

    async approve(timesheetId: string): Promise<Timesheet> {
        const { data } = await apiClient.post<Timesheet>(API_CONFIG.ENDPOINTS.TIMESHEETS.APPROVE(timesheetId));
        return data;
    },
};
