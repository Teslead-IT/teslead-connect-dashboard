/**
 * Attendance API (check-in/out, break). Tenant context via x-org-id header.
 * Check-in/check-out return AttendanceSession (checkIn, checkOut). Start/end-break return AttendanceBreak (startTime, endTime).
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type {
    AttendanceToday,
    CheckInPayload,
    StartBreakPayload,
    AttendanceSessionResponse,
    AttendanceBreakResponse,
    AttendanceMeResponse,
} from '@/types/attendance';

function sessionToToday(session: Record<string, unknown>): AttendanceToday {
    const checkOut = (session.checkOut ?? session.check_out) as string | null | undefined;
    const checkIn = (session.checkIn ?? session.check_in) as string | undefined;
    if (checkOut != null) {
        return { status: 'checked_out', sessionStart: checkIn, checkedOutAt: checkOut };
    }
    return { status: 'checked_in', sessionStart: checkIn, checkedInAt: checkIn };
}

export const attendanceApi = {
    /** GET /attendance/me – current user's attendance in org */
    async getMe(): Promise<AttendanceMeResponse> {
        const { data } = await apiClient.get<AttendanceMeResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.ME);
        return data;
    },

    /** GET /attendance/users/:userId – another user's attendance in org */
    async getUser(userId: string): Promise<AttendanceMeResponse> {
        const { data } = await apiClient.get<AttendanceMeResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.USER(userId));
        return data;
    },

    async getToday(): Promise<AttendanceToday> {
        try {
            const { data } = await apiClient.get<AttendanceToday | AttendanceSessionResponse | Record<string, unknown>>(API_CONFIG.ENDPOINTS.ATTENDANCE.TODAY);
            if (data && typeof data === 'object') {
                if ('status' in data && data.status) return data as AttendanceToday;
                return sessionToToday(data as Record<string, unknown>);
            }
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } })?.response?.status === 404) {
                return { status: 'not_checked_in' };
            }
            throw e;
        }
        return { status: 'not_checked_in' };
    },

    async checkIn(payload: CheckInPayload): Promise<AttendanceSessionResponse> {
        const { data } = await apiClient.post<AttendanceSessionResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.CHECK_IN, payload);
        return data;
    },

    async checkOut(): Promise<AttendanceSessionResponse> {
        const { data } = await apiClient.post<AttendanceSessionResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.CHECK_OUT);
        return data;
    },

    async startBreak(payload: StartBreakPayload): Promise<AttendanceBreakResponse> {
        const { data } = await apiClient.post<AttendanceBreakResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.START_BREAK, payload);
        return data;
    },

    async endBreak(): Promise<AttendanceBreakResponse> {
        const { data } = await apiClient.post<AttendanceBreakResponse>(API_CONFIG.ENDPOINTS.ATTENDANCE.END_BREAK);
        return data;
    },
};
