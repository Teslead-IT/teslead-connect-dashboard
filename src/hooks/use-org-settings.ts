/**
 * Org settings hooks. Key: ['org-settings', activeOrgId]. Invalidated on org switch.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { orgSettingsApi } from '@/services/org-settings.service';
import type { UpdateOrgSettingsPayload } from '@/types/org-settings';

export const orgSettingsKeys = {
    all: ['org-settings'] as const,
    detail: (orgId: string | null) => [...orgSettingsKeys.all, orgId] as const,
};

export function useOrgSettings() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useQuery({
        queryKey: orgSettingsKeys.detail(activeOrgId ?? null),
        queryFn: () => orgSettingsApi.get(),
        enabled: !!activeOrgId,
        staleTime: 0,
    });
}

export function useUpdateOrgSettings() {
    const queryClient = useQueryClient();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    return useMutation({
        mutationFn: (payload: UpdateOrgSettingsPayload) => orgSettingsApi.update(payload),
        onSuccess: () => {
            if (activeOrgId) {
                queryClient.invalidateQueries({ queryKey: orgSettingsKeys.detail(activeOrgId) });
            }
        },
    });
}
