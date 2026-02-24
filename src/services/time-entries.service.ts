/**
 * Time entries API. Tenant context via x-org-id header.
 * Query params: taskId, projectId, etc. No orgId in body.
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { TimeEntry } from '@/types/time-entry';

export interface CreateTimeEntryPayload {
    taskId: string;
    projectId: string;
    startedAt: string; // ISO
    endedAt: string; // ISO
    description?: string;
}

export interface UpdateTimeEntryPayload {
    startedAt?: string;
    endedAt?: string;
    description?: string;
}

export const timeEntriesApi = {
    async list(params: { taskId?: string; projectId?: string; userId?: string; from?: string; to?: string }): Promise<TimeEntry[]> {
        const { data } = await apiClient.get<TimeEntry[]>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.LIST, { params });
        return Array.isArray(data) ? data : [];
    },

    async create(payload: CreateTimeEntryPayload): Promise<TimeEntry> {
        const { data } = await apiClient.post<TimeEntry>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.CREATE, payload);
        return data;
    },

    async update(id: string, payload: UpdateTimeEntryPayload): Promise<TimeEntry> {
        const { data } = await apiClient.patch<TimeEntry>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.UPDATE(id), payload);
        return data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(API_CONFIG.ENDPOINTS.TIME_ENTRIES.DELETE(id));
    },
};
