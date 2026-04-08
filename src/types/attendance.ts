/**
 * Attendance (check-in/out, break). Not persisted.
 * Enums align with backend Prisma: WorkMode, BreakType.
 */

export type AttendanceStatus = 'not_checked_in' | 'checked_in' | 'on_break' | 'on_lunch' | 'checked_out';

/** Backend: WorkMode enum */
export type WorkMode = 'OFFICE' | 'WFH' | 'REMOTE';

/** Backend: BreakType enum */
export type BreakType = 'LUNCH' | 'BREAK';

export interface AttendanceToday {
    status: AttendanceStatus;
    sessionStart?: string; // ISO
    breakStart?: string; // ISO
    lunchStart?: string; // ISO
    checkedInAt?: string;
    checkedOutAt?: string;
}

export interface CheckInPayload {
    workMode: WorkMode;
}

export interface StartBreakPayload {
    type: BreakType;
}

/** Backend check-in/check-out response (AttendanceSession) */
export interface AttendanceSessionResponse {
    id?: string;
    checkIn: string;
    checkOut: string | null;
    workMode?: string;
    totalMinutes?: number | null;
}

/** Backend start-break/end-break response (AttendanceBreak) */
export interface AttendanceBreakResponse {
    id?: string;
    sessionId?: string;
    type: string;
    startTime: string;
    endTime: string | null;
}

/** GET /attendance/me and GET /attendance/users/:userId response */
export type AttendanceMeStatus = 'checked_in' | 'on_break' | 'on_lunch' | 'checked_out';

export interface AttendanceMeSession {
    id: string;
    orgId: string;
    checkIn: string;
    workMode?: string;
}

export interface AttendanceMeBreak {
    id: string;
    type: string;
    startTime: string;
}

export interface AttendanceMeResponse {
    userId?: string;
    status: AttendanceMeStatus;
    session: AttendanceMeSession | null;
    activeBreak: AttendanceMeBreak | null;
}
