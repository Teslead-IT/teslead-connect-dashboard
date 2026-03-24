import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    meetingsApi,
    MeetingCreatePayload,
    MeetingUpdatePayload,
    MeetingResponse,
    PaginatedMeetingsResponse,
} from '@/services/meetings.service';
import { useOrgStore } from '@/stores/orgStore';

// Re-export types for convenience
export type { MeetingResponse, MeetingCreatePayload, MeetingUpdatePayload, PaginatedMeetingsResponse };

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
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: ['meetings', activeOrgId, params],
        queryFn: () => meetingsApi.getAll(params),
        enabled: !!activeOrgId,
    });
}

/**
 * Fetch a single meeting by ID
 */
export function useMeeting(meetingId: string) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: ['meeting', activeOrgId, meetingId],
        queryFn: () => meetingsApi.getById(meetingId),
        enabled: !!meetingId && !!activeOrgId,
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
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: ['project-meetings', activeOrgId, projectId, params],
        queryFn: () => meetingsApi.getByProject(projectId, params),
        enabled: !!projectId && !!activeOrgId,
    });
}
