/**
 * Attendance state (check-in/out, break). Org-scoped, NOT persisted.
 * Cleared on org switch. Never derived from user/identity.
 */

import { create } from 'zustand';
import type { AttendanceToday, AttendanceStatus } from '@/types/attendance';

interface AttendanceState {
    status: AttendanceStatus;
    sessionStart: string | null;
    breakStart: string | null;
    lunchStart: string | null;
    checkedOutAt: string | null;
    setAttendance: (data: AttendanceToday) => void;
    setStatus: (status: AttendanceStatus, extra?: { sessionStart?: string; breakStart?: string; lunchStart?: string }) => void;
    clearAttendance: () => void;
}

const initial: Pick<AttendanceState, 'status' | 'sessionStart' | 'breakStart' | 'lunchStart' | 'checkedOutAt'> = {
    status: 'not_checked_in',
    sessionStart: null,
    breakStart: null,
    lunchStart: null,
    checkedOutAt: null,
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
    ...initial,
    setAttendance: (data) => set({
        status: data.status ?? 'NOT_CHECKED_IN',
        sessionStart: data.sessionStart ?? null,
        breakStart: data.breakStart ?? null,
        lunchStart: data.lunchStart ?? null,
        checkedOutAt: data.checkedOutAt ?? null,
    }),
    setStatus: (status, extra) => set({
        status,
        ...(extra?.sessionStart != null && { sessionStart: extra.sessionStart }),
        ...(extra?.breakStart != null && { breakStart: extra.breakStart }),
        ...(extra?.lunchStart != null && { lunchStart: extra.lunchStart }),
    }),
    clearAttendance: () => set(initial),
}));
