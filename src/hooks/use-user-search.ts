
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invitationsApi } from '@/services/invitations.service';
import { useDebounce } from './use-debounce';


export function useUserSearch(query: string, projectId?: string, orgId?: string) {
    const debouncedQuery = useDebounce(query, 300);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['user-search', debouncedQuery, projectId, orgId],
        queryFn: () => invitationsApi.searchUsers({
            query: debouncedQuery,
            limit: 4,
            page: 1,
            projectId: projectId,
            orgId: orgId
        }),
        enabled: debouncedQuery.length > 0,
    });

    return {
        results: data?.data || [],
        isLoading: isLoading && debouncedQuery.length > 0,
        isError,
    };
}
