import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    meetingsApi,
    MeetingCreatePayload,
    MeetingUpdatePayload,
    MeetingResponse,
    PaginatedMeetingsResponse,
} from '@/services/meetings.service';
import { useUser } from '@/hooks/use-auth';

// Re-export types for convenience
export type { MeetingResponse, MeetingCreatePayload, MeetingUpdatePayload, PaginatedMeetingsResponse };

// Helper to extract orgId safely
const getOrgIdFromUser = (user: any) => {
    return user?.currentOrgId || user?.organizationId || user?.memberships?.[0]?.orgId || user?.orgId || user?.organizations?.[0]?.id || '';
};

/**
 * Fetch all meetings (paginated, with optional filters)
 */
export function useMeetings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
}) {
    const { data: user } = useUser();
    const orgId = getOrgIdFromUser(user);

    return useQuery({
        queryKey: ['meetings', orgId, params],
        queryFn: () => meetingsApi.getAll(params),
        enabled: !!orgId,
    });
}

/**
 * Fetch a single meeting by ID
 */
export function useMeeting(meetingId: string) {
    const { data: user } = useUser();
    const orgId = getOrgIdFromUser(user);

    return useQuery({
        queryKey: ['meeting', orgId, meetingId],
        queryFn: () => meetingsApi.getById(meetingId),
        enabled: !!meetingId && !!orgId,
    });
}

/**
 * Create a new meeting
 */
export function useCreateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: MeetingCreatePayload) => meetingsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}

/**
 * Update a meeting
 */
export function useUpdateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: MeetingUpdatePayload & { id: string }) =>
            meetingsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            queryClient.invalidateQueries({ queryKey: ['meeting'] });
        },
    });
}

/**
 * Publish a draft meeting
 */
export function usePublishMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (meetingId: string) => meetingsApi.publish(meetingId),
        onSuccess: (_, meetingId) => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            queryClient.invalidateQueries({ queryKey: ['meeting'] });
        },
    });
}

/**
 * Delete a meeting
 */
export function useDeleteMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (meetingId: string) => meetingsApi.delete(meetingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}

/**
 * Fetch meetings for a specific project (Project MOM Tab)
 */
export function useProjectMeetings(projectId: string, params?: { page?: number; limit?: number }) {
    const { data: user } = useUser();
    const orgId = getOrgIdFromUser(user);

    return useQuery({
        queryKey: ['project-meetings', orgId, projectId, params],
        queryFn: () => meetingsApi.getByProject(projectId, params),
        enabled: !!projectId && !!orgId,
    });
}
