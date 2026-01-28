/**
 * WebSocket Notifications Hook
 * Real-time notification system for invitations
 * 
 * Features:
 * - Auto-reconnect on disconnect
 * - Authentication with JWT
 * - Type-safe event handling
 * - Integration with React Query cache
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/lib/token-storage';
import { API_CONFIG } from '@/lib/config';
import { notificationApi } from '@/services/notification.service';
import type { Notification, NotificationType } from '@/types/invitation';
import { invitationKeys } from './use-invitations';

// ============= Configuration =============

const SOCKET_CONFIG = {
    namespace: '/notifications',
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
} as const;

// ============= Types =============

interface NotificationHandler {
    (notification: Notification): void;
}

interface UseNotificationsOptions {
    /** Enable automatic connection */
    autoConnect?: boolean;
    /** Custom notification handler */
    onNotification?: NotificationHandler;
    /** Automatically invalidate queries on specific notification types */
    autoInvalidate?: boolean;
}

interface UseNotificationsReturn {
    /** All received notifications */
    notifications: Notification[];
    /** Unread notifications count */
    unreadCount: number;
    /** Connection status */
    isConnected: boolean;
    /** Mark notification as read */
    markAsRead: (notificationId: string) => void;
    /** Mark all as read */
    markAllAsRead: () => void;
    /** Clear all notifications */
    clearAll: () => void;
    /** Manually connect */
    connect: () => void;
    /** Manually disconnect */
    disconnect: () => void;
}

// ============= Hook =============

/**
 * Hook: WebSocket Notifications
 * Manages real-time notification connection and state
 * 
 * @param options - Configuration options
 * @returns Notification state and control functions
 */
export function useNotifications(
    options: UseNotificationsOptions = {}
) {
    const {
        autoConnect = true,
        onNotification,
        autoInvalidate = true,
    } = options;

    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Fetch unread notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: notificationApi.getUnread,
        refetchInterval: 60000, // Poll every minute as backup
    });

    // Mutation to mark as read
    const markAsReadMutation = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: (updatedNotification) => {
            queryClient.setQueryData(['notifications', 'unread'], (old: Notification[] = []) =>
                old.filter(n => n.id !== updatedNotification.id)
            );
        },
    });

    /**
     * Handle incoming notifications
     */
    const handleNotification = useCallback(
        (notification: Notification) => {
            // Invalidate query to fetch fresh data from API
            // This ensures data consistency (e.g. dates, types) matching the GET endpoint
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });

            // Call custom handler if provided
            if (onNotification) {
                onNotification(notification);
            }

            // Auto-invalidate queries based on notification type
            if (autoInvalidate) {
                switch (notification.type) {
                    case 'INVITE_RECEIVED':
                        queryClient.invalidateQueries({
                            queryKey: invitationKeys.pending(),
                        });
                        break;
                    case 'INVITE_ACCEPTED':
                    case 'INVITE_REJECTED':
                        queryClient.invalidateQueries({
                            queryKey: ['auth', 'user'],
                        });
                        break;
                    case 'INVITE_EXPIRED':
                        queryClient.invalidateQueries({
                            queryKey: invitationKeys.pending(),
                        });
                        break;
                    case 'TASK_ASSIGNED':
                        if (notification.projectId) {
                            queryClient.invalidateQueries({
                                queryKey: ['tasks', notification.projectId],
                            });
                        }
                        break;
                }
            }
        },
        [onNotification, autoInvalidate, queryClient]
    );

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        // Ensure we have a valid token before attempting connection
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
        if (!token) {
            console.warn('[Notification] No auth token found, skipping connection');
            return;
        }

        // Construct proper URL
        // If BASE_URL has /api suffix, remove it to find the root domain for socket
        // Example: http://localhost:3000/api -> http://localhost:3000
        const baseUrl = API_CONFIG.BASE_URL.replace(/\/api\/v\d+|\/api\/?$/, '').replace(/\/$/, '');
        const socketUrl = `${baseUrl}${SOCKET_CONFIG.namespace}`;

        console.log('[Notification] Initializing socket connection...');
        console.log('[Notification] Target URL:', socketUrl);

        // Connect to namespace specifically
        const nspSocket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            auth: { token },
            reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
            reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
            reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
        });

        nspSocket.on('connect', () => {
            console.log('✅ [Notification] Connected to WebSocket service');
            console.log('   ID:', nspSocket.id);
            setIsConnected(true);
        });

        nspSocket.on('disconnect', (reason) => {
            console.warn('❌ [Notification] Disconnected:', reason);
            setIsConnected(false);
        });

        nspSocket.on('connect_error', (err) => {
            console.error('⚠️ [Notification] Connection Error:', err.message);
            setIsConnected(false);
        });

        nspSocket.on('notification:new', (payload) => {
            console.log('🔔 [Notification] New notification received:', payload);
            handleNotification(payload);
        });

        socketRef.current = nspSocket;
    }, [handleNotification]);

    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    const markAsRead = useCallback((notificationId: string) => {
        markAsReadMutation.mutate(notificationId);
    }, [markAsReadMutation]);

    const markAllAsRead = useCallback(() => {
        // Optimistically clear all
        const current = notifications;
        queryClient.setQueryData(['notifications', 'unread'], []);

        // Loop and mark each (or implement bulk endpoint if available later)
        // For now, let's just mark individual ones as backend doesn't show bulk endpoint yet
        // Ideally backend should have PUT /notifications/read-all
        current.forEach(n => markAsReadMutation.mutate(n.id));
    }, [notifications, markAsReadMutation, queryClient]);

    const clearAll = useCallback(() => {
        // UI only clear, effectively same as markAllAsRead for unread list
        markAllAsRead();
    }, [markAllAsRead]);

    useEffect(() => {
        if (autoConnect) connect();
        return () => disconnect();
    }, [autoConnect, connect, disconnect]);

    return {
        notifications,
        unreadCount: notifications.length,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearAll,
        connect,
        disconnect,
    };
}

// ============= Notification Type Filter Hook =============

/**
 * Hook: Filter notifications by type
 * 
 * @param notifications - All notifications
 * @param type - Notification type to filter
 * @returns Filtered notifications
 */
export function useNotificationsByType(
    notifications: Notification[],
    type: NotificationType
): Notification[] {
    return notifications.filter((n) => n.type === type);
}

/**
 * Hook: Filter unread notifications
 */
export function useUnreadNotifications(notifications: Notification[]): Notification[] {
    return notifications.filter((n) => !n.read);
}

