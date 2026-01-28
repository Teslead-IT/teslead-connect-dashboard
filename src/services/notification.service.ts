/**
 * Notification API Service
 * Handles notification-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { Notification } from '@/types/invitation';

export const notificationApi = {
    /**
     * Get all notifications with pagination and filtering
     */
    async getAll(params: { page?: number; limit?: number; unread?: boolean } = {}): Promise<import('@/types/invitation').NotificationResponse> {
        const queryParams: any = {
            page: params.page,
            limit: params.limit,
        };

        if (params.unread) {
            queryParams.status = 'unread';
        }

        const { data } = await apiClient.get<import('@/types/invitation').NotificationResponse>(
            API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST,
            { params: queryParams }
        );
        return data;
    },

    /**
     * Get unread notifications
     */
    async getUnread(): Promise<Notification[]> {
        const { data } = await apiClient.get<import('@/types/invitation').NotificationResponse>(
            API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST,
            {
                params: {
                    status: 'unread',
                    limit: 50 // Fetch reasonable amount of unread notifications
                }
            }
        );
        return data.data;
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
