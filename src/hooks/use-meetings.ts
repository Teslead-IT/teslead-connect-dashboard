import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface Meeting {
    id: string;
    orgId: string;
    projectId: string;
    meetingDate: Date | string;
    location?: string;
    purpose?: string;
    noOfPeople: number;
    attendedBy?: string;
    absentees?: string;
    description?: string;  // Rich text HTML content
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy?: string;
    project?: {
        id: string;
        name: string;
    };
    points?: MeetingPoint[];
}

export interface MeetingPoint {
    id?: string;
    sno: number;
    description: string;
    remark?: string;
}

export interface CreateMeetingRequest {
    projectId: string;
    meetingDate: string;
    location: string;
    purpose?: string;
    noOfPeople: number;
    attendedBy?: string;
    absentees?: string;
    points: MeetingPoint[];
}

// Fetch all meetings (global view or project-specific)
export function useMeetings(projectId?: string) {
    return useQuery({
        queryKey: ['meetings', projectId],
        queryFn: async () => {
            const params = projectId ? { projectId } : {};
            const response = await apiClient.get<Meeting[]>('/meetings', {
                params,
            });
            return response.data;
        },
    });
}

// Create a new meeting
export function useCreateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateMeetingRequest) => {
            const { projectId, ...meetingData } = data;
            const response = await apiClient.post<Meeting>(
                `/projects/${projectId}/meetings`,
                meetingData
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalidate meetings queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}

// Get single meeting details
export function useMeeting(meetingId: string) {
    return useQuery({
        queryKey: ['meeting', meetingId],
        queryFn: async () => {
            const response = await apiClient.get<Meeting>(`/meetings/${meetingId}`);
            return response.data;
        },
        enabled: !!meetingId,
    });
}

// Update a meeting
export function useUpdateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId, ...data }: Partial<CreateMeetingRequest> & { id: string }) => {
            const response = await apiClient.patch<Meeting>(
                `/meetings/${id}`,
                data
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
        },
    });
}

// Delete a meeting
export function useDeleteMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/meetings/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}
