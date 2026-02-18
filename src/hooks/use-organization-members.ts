
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/services/invitations.service';
import { useToast } from '@/components/ui/Toast';

export function useOrganizationMembers(orgId: string, query: string = '') {
    const queryClient = useQueryClient();
    const toast = useToast();

    const membersQuery = useQuery({
        queryKey: ['organization-members', orgId, query],
        queryFn: () => invitationsApi.searchUsers({
            query,
            orgId,
            limit: 20,
            page: 1,
        }),
        enabled: !!orgId,
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            invitationsApi.updateMemberRole(orgId, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-members', orgId] });
        }
    });

    return {
        members: membersQuery.data?.data || [],
        isLoading: membersQuery.isLoading,
        isError: membersQuery.isError,
        updateRole: updateRoleMutation.mutate,
        updateRoleAsync: updateRoleMutation.mutateAsync,
        isUpdating: updateRoleMutation.isPending,
    };
}
