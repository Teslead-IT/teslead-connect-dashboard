/**
 * Timer (task-based). Not persisted; cleared on org switch.
 * Aligns with ATTENDANCE_AND_TIMERS_API.md.
 */

export interface ActiveTimer {
    id: string;
    userId?: string;
    orgId?: string;
    projectId: string | null;
    phaseId: string | null;
    taskListId: string | null;
    taskId: string | null;
    startedAt: string; // ISO
    taskTitle?: string;
    projectName?: string;
}

/** Start with task: projectId + taskId required; phaseId, taskListId optional. Start without task: send {}. */
export interface StartTimerPayload {
    projectId?: string;
    taskId?: string;
    phaseId?: string;
    taskListId?: string;
}

/** Stop: if timer had no task, projectId + taskId required. Optional description, phaseId, taskListId. */
export interface StopTimerPayload {
    description?: string;
    projectId?: string;
    taskId?: string;
    phaseId?: string;
    taskListId?: string;
}
