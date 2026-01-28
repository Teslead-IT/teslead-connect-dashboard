/**
 * Message API Service
 * Handles message-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { Message, MessageResponse } from '@/types/message';

export const messageApi = {
    /**
     * Get all messages with pagination and filtering
     */
    async getAll(params: { page?: number; limit?: number; unread?: boolean } = {}): Promise<MessageResponse> {
        const queryParams: any = {
            page: params.page,
            limit: params.limit,
        };

        if (params.unread) {
            queryParams.status = 'unread';
        }

        const { data } = await apiClient.get<MessageResponse>(
            API_CONFIG.ENDPOINTS.MESSAGES.LIST,
            { params: queryParams }
        );
        return data;
    },

    /**
     * Get unread messages
     */
    async getUnread(): Promise<Message[]> {
        const { data } = await apiClient.get<MessageResponse>(
            API_CONFIG.ENDPOINTS.MESSAGES.LIST,
            {
                params: {
                    status: 'unread',
                    limit: 50 // Fetch reasonable amount of unread messages
                }
            }
        );
        return data.data;
    },

    /**
     * Mark message as read
     */
    async markAsRead(id: string): Promise<Message> {
        const { data } = await apiClient.put<Message>(
            API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ(id)
        );
        return data;
    },
};
