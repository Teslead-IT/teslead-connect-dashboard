import { useActiveTimerSync } from '@/hooks/use-timers';
import { useAttendanceMe } from '@/hooks/use-attendance';
import { usePresence } from '@/hooks/use-presence';

/**
 * When activeOrgId is set (e.g. in dashboard), sync timer and attendance from backend.
 * Presence socket is connected here when enableUserPresence is true.
 */
export function OrgBootSync() {
    useActiveTimerSync();
    useAttendanceMe();
    usePresence();
    return null;
}
