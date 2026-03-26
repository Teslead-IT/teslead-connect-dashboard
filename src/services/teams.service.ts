import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import { UserPresence, UserPresenceStatus } from '@/stores/presenceStore';

export interface TeamMember {
    memberId: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        accountStatus: string;
        lastLoginAt: string;
    };
    presence?: UserPresence;
    attendance?: {
        status: string;
        session?: any;
    };
}

export const teamsApi = {
    /**
     * Fetch all members in the organization with their current role, presence status, and attendance data
     */
    getTeams: async (): Promise<TeamMember[]> => {
        const { data } = await apiClient.get<TeamMember[]>(API_CONFIG.ENDPOINTS.TEAMS.LIST);
        return data;
    },

    /**
     * Update current user's presence status
     */
    updateMyPresence: async (status: UserPresenceStatus, message?: string) => {
        const { data } = await apiClient.patch(API_CONFIG.ENDPOINTS.PRESENCE.UPDATE_STATUS, {
            status,
            message,
        });
        return data;
    },
};
