/**
 * Timers API (task-based). Tenant context via x-org-id header.
 * See ATTENDANCE_AND_TIMERS_API.md: start with/without task, stop with optional body.
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { ActiveTimer, StartTimerPayload, StopTimerPayload } from '@/types/timer';
import type { TimeEntry } from '@/types/time-entry';

export const timersApi = {
    async getActive(): Promise<ActiveTimer | null> {
        const { data } = await apiClient.get<ActiveTimer | null>(API_CONFIG.ENDPOINTS.TIMERS.ACTIVE);
        return data ?? null;
    },

    /** Start with task: { projectId, taskId, phaseId?, taskListId? }. Start without task: {}. */
    async start(payload: StartTimerPayload): Promise<ActiveTimer> {
        const body = Object.keys(payload).length ? payload : {};
        const { data } = await apiClient.post<ActiveTimer>(API_CONFIG.ENDPOINTS.TIMERS.START, body);
        return data;
    },

    /** Stop: optional description. If timer had no task, pass projectId + taskId (and optional phaseId, taskListId). */
    async stop(payload?: StopTimerPayload): Promise<TimeEntry> {
        const body = payload && Object.keys(payload).length ? payload : {};
        const { data } = await apiClient.post<TimeEntry>(API_CONFIG.ENDPOINTS.TIMERS.STOP, body);
        return data;
    },
};
