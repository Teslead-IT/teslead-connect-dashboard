/**
 * Time entries and timesheets.
 */

export interface TimeEntry {
    id: string;
    taskId: string;
    projectId: string;
    userId: string;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    description?: string;
    timesheetId?: string;
    timesheetStatus?: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
}

export interface Timesheet {
    id: string;
    userId: string;
    weekStart: string; // ISO date
    weekEnd: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
    entries?: TimeEntry[];
    totalMinutes?: number;
}
