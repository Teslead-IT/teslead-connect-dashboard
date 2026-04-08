import { useQuery } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { analyticsApi } from '@/services/analytics.service';

export const analyticsKeys = {
    all: ['analytics'] as const,
    org: (orgId: string | null) => [...analyticsKeys.all, 'org', orgId] as const,
    mine: (orgId: string | null) => [...analyticsKeys.all, 'mine', orgId] as const,
    user: (orgId: string | null, userId: string) => [...analyticsKeys.all, 'user', orgId, userId] as const,
};

export function useOrgProductivity() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    
    return useQuery({
        queryKey: analyticsKeys.org(activeOrgId ?? null),
        queryFn: () => analyticsApi.getOrgProductivity(),
        enabled: !!activeOrgId,
    });
}

export function useMyProductivity() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    
    return useQuery({
        queryKey: analyticsKeys.mine(activeOrgId ?? null),
        queryFn: () => analyticsApi.getMyProductivity(),
        enabled: !!activeOrgId,
    });
}

export function useUserProductivity(userId: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    
    return useQuery({
        queryKey: analyticsKeys.user(activeOrgId ?? null, userId),
        queryFn: () => analyticsApi.getUserProductivity(userId),
        enabled: !!activeOrgId && !!userId,
    });
}
