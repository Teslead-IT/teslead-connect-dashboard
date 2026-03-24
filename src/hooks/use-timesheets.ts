/**
 * Timesheets hooks. My / Team. No orgId in body; x-org-id header only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';

import { timesheetsApi } from '@/services/timesheets.service';

export const timesheetKeys = {
    all: ['timesheets'] as const,
    my: (orgId: string | null, weekStart?: string) => [...timesheetKeys.all, 'my', orgId, weekStart] as const,
    team: (orgId: string | null, weekStart?: string) => [...timesheetKeys.all, 'team', orgId, weekStart] as const,
};

export function useMyTimesheets(weekStart?: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useQuery({
        queryKey: timesheetKeys.my(activeOrgId ?? null, weekStart),
        queryFn: () => timesheetsApi.getMy({ weekStart }),
        enabled: !!activeOrgId,
    });
}

export function useTeamTimesheets(weekStart?: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useQuery({
        queryKey: timesheetKeys.team(activeOrgId ?? null, weekStart),
        queryFn: () => timesheetsApi.getTeam({ weekStart }),
        enabled: !!activeOrgId,
    });
}

export function useSubmitTimesheet() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useMutation({
        mutationFn: (payload: { weekStart: string }) => timesheetsApi.submit(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timesheetKeys.all });
            if (activeOrgId) {
                queryClient.invalidateQueries({ queryKey: timesheetKeys.my(activeOrgId, undefined) });
            }
        },
    });
}

export function useApproveTimesheet() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (timesheetId: string) => timesheetsApi.approve(timesheetId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: timesheetKeys.all }),
    });
}
