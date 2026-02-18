/**
 * Meetings API Service
 * All meeting-related API calls are centralized here
 */

import { apiClient } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';

function getOrgId(): string {
    const user = tokenStorage.getUser();
    const orgId = user?.currentOrgId || user?.organizationId || user?.memberships?.[0]?.orgId || user?.orgId || user?.organizations?.[0]?.id || '';

    // Debug logging for mention issue
    if (!orgId) {
        console.warn('[MeetingsService] getOrgId failed. User object:', user);
    } else {
        console.log('[MeetingsService] getOrgId resolved:', orgId);
    }

    return orgId;
}

export interface MeetingCreatePayload {
    title: string;
    content?: any; // TipTap JSON
    meetingDate: string;
    location?: string;
    numberOfPeople?: number;
    time?: string;
    purpose?: string;
    attendedBy?: string;
    absentees?: string;
    projectId?: string;
    status?: 'DRAFT' | 'PUBLISHED';
}

export interface MeetingUpdatePayload extends Partial<MeetingCreatePayload> { }

export interface MeetingResponse {
    id: string;
    title: string;
    content?: any;
    meetingDate: string;
    location?: string;
    numberOfPeople?: number;
    time?: string;
    purpose?: string;
    attendedBy?: string;
    absentees?: string;
    status?: 'DRAFT' | 'PUBLISHED';
    projectId?: string;
    project?: { id: string; name: string };
    createdBy?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedMeetingsResponse {
    data: MeetingResponse[];
    total: number;
    page: number;
    totalPages: number;
}

export interface SuggestUserItem {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface SuggestProjectItem {
    id: string;
    name: string;
    color?: string;
}

export const meetingsApi = {
    /**
     * List meetings with pagination and filters
     */
    async getAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<PaginatedMeetingsResponse> {
        const orgId = getOrgId();
        // Strip out empty/falsy values so they don't get sent as empty query params
        const cleanParams = params
            ? Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            )
            : undefined;
        const { data } = await apiClient.get<PaginatedMeetingsResponse>(
            `/organizations/${orgId}/meetings`,
            { params: cleanParams }
        );
        return data;
    },

    /**
     * Get a single meeting by ID
     */
    async getById(meetingId: string): Promise<MeetingResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<MeetingResponse>(
            `/organizations/${orgId}/meetings/${meetingId}`
        );
        return data;
    },

    /**
     * Create a new meeting
     */
    async create(payload: MeetingCreatePayload): Promise<MeetingResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.post<MeetingResponse>(
            `/organizations/${orgId}/meetings`,
            payload
        );
        return data;
    },

    /**
     * Update a meeting (partial)
     */
    async update(meetingId: string, payload: MeetingUpdatePayload): Promise<MeetingResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.patch<MeetingResponse>(
            `/organizations/${orgId}/meetings/${meetingId}`,
            payload
        );
        return data;
    },

    /**
     * Publish a draft meeting
     */
    async publish(meetingId: string): Promise<MeetingResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.patch<MeetingResponse>(
            `/organizations/${orgId}/meetings/${meetingId}/publish`,
            {}
        );
        return data;
    },

    /**
     * Soft-delete a meeting
     */
    async delete(meetingId: string): Promise<void> {
        const orgId = getOrgId();
        await apiClient.delete(`/organizations/${orgId}/meetings/${meetingId}`);
    },

    /**
     * Autocomplete: suggest users for @ mentions
     */
    async suggestUsers(query: string): Promise<SuggestUserItem[]> {
        const orgId = getOrgId();
        if (!orgId) return [];

        const { data } = await apiClient.get<SuggestUserItem[]>(
            `/organizations/${orgId}/meetings/suggest/users`,
            { params: { q: query } }
        );
        return data;
    },

    /**
     * Autocomplete: suggest projects for # mentions
     */
    async suggestProjects(query: string): Promise<SuggestProjectItem[]> {
        const orgId = getOrgId();
        if (!orgId) return [];

        const { data } = await apiClient.get<SuggestProjectItem[]>(
            `/organizations/${orgId}/meetings/suggest/projects`,
            { params: { q: query } }
        );
        return data;
    },

    /**
     * Get meetings for a specific project (Project MOM Tab)
     */
    async getByProject(projectId: string, params?: { page?: number; limit?: number }): Promise<PaginatedMeetingsResponse> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<PaginatedMeetingsResponse>(
            `/organizations/${orgId}/projects/${projectId}/meetings`,
            { params }
        );
        return data;
    },
};
