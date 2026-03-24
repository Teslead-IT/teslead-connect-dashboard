'use client';

import { useActiveTimerSync } from '@/hooks/use-timers';
import { useAttendanceToday } from '@/hooks/use-attendance';
import { usePresence } from '@/hooks/use-presence';

/**
 * When activeOrgId is set (e.g. in dashboard), sync timer and attendance from backend.
 * Presence socket is connected here when enableUserPresence is true.
 */
export function OrgBootSync() {
    useActiveTimerSync();
    useAttendanceToday();
    usePresence();
    return null;
}
