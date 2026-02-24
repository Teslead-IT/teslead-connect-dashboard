/**
 * Time entries hooks. List by taskId/projectId. No orgId in query/body; x-org-id header only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { timeEntriesApi, type CreateTimeEntryPayload, type UpdateTimeEntryPayload } from '@/services/time-entries.service';

export const timeEntryKeys = {
    all: ['time-entries'] as const,
    list: (orgId: string | null, params: { taskId?: string; projectId?: string }) =>
        [...timeEntryKeys.all, orgId, params] as const,
};

export function useTimeEntries(params: { taskId?: string; projectId?: string }) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useQuery({
        queryKey: timeEntryKeys.list(activeOrgId ?? null, params),
        queryFn: () => timeEntriesApi.list(params),
        enabled: !!activeOrgId,
    });
}

export function useCreateTimeEntry() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useMutation({
        mutationFn: (payload: CreateTimeEntryPayload) => timeEntriesApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timeEntryKeys.all });
            if (activeOrgId) {
                queryClient.invalidateQueries({ queryKey: timeEntryKeys.list(activeOrgId, {}) });
            }
        },
    });
}

export function useUpdateTimeEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTimeEntryPayload }) =>
            timeEntriesApi.update(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: timeEntryKeys.all }),
    });
}

export function useDeleteTimeEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => timeEntriesApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: timeEntryKeys.all }),
    });
}
