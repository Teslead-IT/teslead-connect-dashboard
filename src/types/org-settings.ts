/**
 * Organization settings (productivity & tracking).
 * Backend is source of truth; x-org-id header for context.
 */

export interface OrgSettings {
    requireAttendance: boolean;
    requireCheckInForTimer: boolean;
    allowManualTimeEntry: boolean;
    allowMultipleTimers: boolean;
    requireTimesheetApproval: boolean;
    enableUserPresence: boolean;
    enforceStrictProjectRole: boolean;
    lockTimesheetAfterApproval: boolean;
    autoSubmitTimesheet: boolean;
}

export type UpdateOrgSettingsPayload = Partial<OrgSettings>;
