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
import { useDesktopNotification, toDesktopNotificationOptions } from './use-desktop-notification';

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
    /** Desktop notification permission status */
    desktopPermission: NotificationPermission;
    /** Whether desktop notifications are enabled */
    desktopEnabled: boolean;
    /** Whether notification sound is enabled */
    soundEnabled: boolean;
    /** Toggle desktop notifications */
    setDesktopEnabled: (enabled: boolean) => void;
    /** Toggle notification sound */
    setSoundEnabled: (enabled: boolean) => void;
    /** Request desktop notification permission */
    requestDesktopPermission: () => Promise<NotificationPermission>;
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
    const handleNotificationRef = useRef<(notification: Notification) => void>(() => { });

    // Desktop notification support
    const {
        permissionStatus: desktopPermission,
        isEnabled: desktopEnabled,
        isSoundEnabled: soundEnabled,
        requestPermission: requestDesktopPermission,
        showDesktopNotification,
        setEnabled: setDesktopEnabled,
        setSoundEnabled,
    } = useDesktopNotification();

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

            // Show desktop notification with sound
            showDesktopNotification(toDesktopNotificationOptions(notification));

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
        [onNotification, autoInvalidate, queryClient, showDesktopNotification]
    );

    // Keep a stable ref so connect() never needs to re-create when handler changes
    useEffect(() => {
        handleNotificationRef.current = handleNotification;
    }, [handleNotification]);

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        // Disconnect any existing socket first (handles React StrictMode double-mount)
        if (socketRef.current) {
            if (socketRef.current.connected) return; // Already connected, skip
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Ensure we have a valid token before attempting connection
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
        if (!token) {
            console.warn('[Notification] No auth token found, skipping connection');
            return;
        }

        // Get user info for userId (backend expects userId in handshake auth)
        const user = tokenStorage.getUser();
        const userId = user?.id || user?._id || user?.sub;

        // Construct proper URL
        // If BASE_URL has /api suffix, remove it to find the root domain for socket
        // Example: http://localhost:3000/api -> http://localhost:3000
        const baseUrl = API_CONFIG.BASE_URL.replace(/\/api\/v\d+|\/api\/?$/, '').replace(/\/$/, '');
        const socketUrl = `${baseUrl}${SOCKET_CONFIG.namespace}`;

        // Connect to namespace — backend expects userId for socket mapping,
        // WsJwtGuard validates the JWT token from auth.token or headers
        const nspSocket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            auth: { userId, token },
            extraHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
            reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
            reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
        });

        nspSocket.on('connect', () => {
            setIsConnected(true);
        });

        nspSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        nspSocket.on('connect_error', () => {
            setIsConnected(false);
        });

        nspSocket.on('notification:new', (payload) => {
            handleNotificationRef.current(payload);
        });

        socketRef.current = nspSocket;
    }, []); // No dependencies — connect is stable, uses refs for dynamic values

    // Request desktop permission when connected for the first time
    useEffect(() => {
        if (isConnected && desktopPermission === 'default') {
            requestDesktopPermission();
        }
    }, [isConnected, desktopPermission, requestDesktopPermission]);

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
        // Desktop notification controls
        desktopPermission,
        desktopEnabled,
        soundEnabled,
        setDesktopEnabled,
        setSoundEnabled,
        requestDesktopPermission,
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

