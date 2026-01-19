/**
 * Notification API Service
 * Handles notification-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { Notification } from '@/types/invitation';

export const notificationApi = {
    /**
     * Get unread notifications
     */
    async getUnread(): Promise<Notification[]> {
        const { data } = await apiClient.get<Notification[]>(
            API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNREAD
        );
        return data;
    },

    /**
     * Mark notification as read
     */
    async markAsRead(id: string): Promise<Notification> {
        const { data } = await apiClient.put<Notification>(
            API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
        );
        return data;
    },
};
