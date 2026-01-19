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
            // Add to query cache
            queryClient.setQueryData(['notifications', 'unread'], (old: Notification[] = []) => {
                // Check if already exists to prevent duplicates
                if (old.some(n => n.id === notification.id)) return old;
                return [notification, ...old];
            });

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

        // Construct proper URL - handle potential trailing slash in BASE_URL
        const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
        const socketUrl = `${baseUrl}${SOCKET_CONFIG.namespace}`;

        console.log('[Notification] Connecting to:', socketUrl);

        const socket = io(socketUrl, {
            auth: { token }, // Token passed in auth object as requested
            reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
            reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
            reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
            transports: ['websocket', 'polling'],
            path: '/socket.io/', // Standard socket.io path, usually default but good to be explicit if backend API is under a subpath
        });

        socket.on('connect', () => {
            console.log('✅ Connected to notification service');
            setIsConnected(true);
        });

        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', () => setIsConnected(false));

        socket.on('notification:new', handleNotification);

        socketRef.current = socket;
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

