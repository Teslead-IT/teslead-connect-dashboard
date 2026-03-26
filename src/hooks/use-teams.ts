import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, TeamMember } from '@/services/teams.service';
import { usePresenceStore, UserPresence, UserPresenceStatus } from '@/stores/presenceStore';
import { useEffect, useMemo } from 'react';

export function useTeams() {
    const queryClient = useQueryClient();
    const setAllPresences = usePresenceStore((s) => s.setAllPresences);
    const presences = usePresenceStore((s) => s.presences);

    const teamsQuery = useQuery({
        queryKey: ['teams'],
        queryFn: teamsApi.getTeams,
    });

    // Initialize presence store with data from API
    useEffect(() => {
        if (teamsQuery.data) {
            const initialPresences: Record<string, UserPresence> = {};
            teamsQuery.data.forEach((member) => {
                if (member.user?.id) {
                    initialPresences[member.user.id] = member.presence || { status: 'OFFLINE' };
                }
            });
            setAllPresences(initialPresences);
        }
    }, [teamsQuery.data, setAllPresences]);

    // Merge static team data with real-time presence from store
    const mergedTeams = useMemo(() => {
        if (!teamsQuery.data) return [];
        return teamsQuery.data.map((member) => {
            const realTimePresence = presences[member.user.id];
            return {
                ...member,
                presence: realTimePresence || member.presence || { status: 'OFFLINE' },
            };
        });
    }, [teamsQuery.data, presences]);

    const updatePresenceMutation = useMutation({
        mutationFn: ({ status, message }: { status: UserPresenceStatus; message?: string }) =>
            teamsApi.updateMyPresence(status, message),
        onSuccess: () => {
            // No need to invalidate tasks/teams as websocket will update it real-time
            // But we can invalidate just in case or to sync other UI parts
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    return {
        teams: mergedTeams,
        isLoading: teamsQuery.isLoading,
        isError: teamsQuery.isError,
        updatePresence: updatePresenceMutation.mutate,
        isUpdating: updatePresenceMutation.isPending,
    };
}
