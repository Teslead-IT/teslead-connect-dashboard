/**
 * Timer hooks. On boot (when activeOrgId exists) fetch GET /timers/active and set/clear store.
 * Never persist timer; clear on org switch (handled in useSwitchOrg).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { useTimerStore } from '@/stores/timerStore';
import { timersApi } from '@/services/timers.service';
import type { StartTimerPayload, StopTimerPayload } from '@/types/timer';
import { attendanceKeys } from './use-attendance';
import { timeEntryKeys } from './use-time-entries';

export const timerKeys = {
    active: (orgId: string | null) => ['timers', 'active', orgId] as const,
};

/** Fetch active timer on app boot when org is set; syncs store with backend. */
export function useActiveTimerSync() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setTimer = useTimerStore((s) => s.setTimer);
    const clearTimer = useTimerStore((s) => s.clearTimer);

    return useQuery({
        queryKey: timerKeys.active(activeOrgId ?? null),
        queryFn: async () => {
            const timer = await timersApi.getActive();
            if (timer) setTimer(timer);
            else clearTimer();
            return timer;
        },
        enabled: !!activeOrgId,
        staleTime: 0,
    });
}

export function useStartTimer() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setTimer = useTimerStore((s) => s.setTimer);

    return useMutation({
        mutationFn: (payload: StartTimerPayload) => timersApi.start(payload),
        onSuccess: (data) => {
            setTimer(data);
            queryClient.invalidateQueries({ queryKey: timerKeys.active(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });
}

export function useStopTimer() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const clearTimer = useTimerStore((s) => s.clearTimer);

    return useMutation({
        mutationFn: (payload?: StopTimerPayload) => timersApi.stop(payload),
        onSuccess: () => {
            clearTimer();
            queryClient.invalidateQueries({ queryKey: timerKeys.active(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.today(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.me(activeOrgId ?? null) });
            queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });
}
