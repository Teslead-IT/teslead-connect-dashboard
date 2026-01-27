/**
 * WebSocket Messages Hook
 * Real-time message system
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/lib/token-storage';
import { API_CONFIG } from '@/lib/config';
import { messageApi } from '@/services/message.service';
import type { Message } from '@/types/message';

// ============= Configuration =============

const SOCKET_CONFIG = {
    // Reusing the notification namespace or a new one? 
    // Usually messages might be on the same namespace or '/messages'.
    // Given 'same api' from user, likely same socket connection sharing or similar pattern.
    // Let's assume it shares the namespace for now or uses /messages if supported.
    // But since config has WEBSOCKET.NAMESPACE = '/notifications', I'll stick to a separate logic or same namespace?
    // Let's assume the user meant same *pattern*, so I'll use /messages namespace if I can, or re-use /notifications?
    // If I use a different namespace, I need to know if backend supports it.
    // Safest is to use the SAME namespace '/notifications' if strict "same api" means "same socket namespace"?
    // But typically chat is separate.
    // I will use '/messages' as namespace to be safe, or just '/notifications' if I want to be conservative.
    // Let's use '/messages' for the namespace to keep it clean, mirroring the config pattern.
    namespace: '/messages',
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
} as const;

// ============= Types =============

interface MessageHandler {
    (message: Message): void;
}

interface UseMessagesOptions {
    /** Enable automatic connection */
    autoConnect?: boolean;
    /** Custom message handler */
    onMessage?: MessageHandler;
    /** Automatically invalidate queries */
    autoInvalidate?: boolean;
}

interface UseMessagesReturn {
    /** All received messages */
    messages: Message[];
    /** Unread messages count */
    unreadCount: number;
    /** Connection status */
    isConnected: boolean;
    /** Mark message as read */
    markAsRead: (messageId: string) => void;
    /** Mark all as read */
    markAllAsRead: () => void;
    /** Manually connect */
    connect: () => void;
    /** Manually disconnect */
    disconnect: () => void;
}

// ============= Hook =============

export function useMessages(
    options: UseMessagesOptions = {}
): UseMessagesReturn {
    const {
        autoConnect = true,
        onMessage,
        autoInvalidate = true,
    } = options;

    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Fetch unread messages
    const { data: messages = [] } = useQuery({
        queryKey: ['messages', 'unread'],
        queryFn: messageApi.getUnread,
        refetchInterval: 60000,
    });

    // Mutation to mark as read
    const markAsReadMutation = useMutation({
        mutationFn: messageApi.markAsRead,
        onSuccess: (updatedMessage) => {
            queryClient.setQueryData(['messages', 'unread'], (old: Message[] = []) =>
                old.filter(m => m.id !== updatedMessage.id)
            );
        },
    });

    /**
     * Handle incoming messages
     */
    const handleMessage = useCallback(
        (message: Message) => {
            queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });

            if (onMessage) {
                onMessage(message);
            }
        },
        [onMessage, queryClient]
    );

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);
        if (!token) return;

        const baseUrl = API_CONFIG.BASE_URL.replace(/\/api\/v\d+|\/api\/?$/, '').replace(/\/$/, '');
        const socketUrl = `${baseUrl}${SOCKET_CONFIG.namespace}`;

        // Connect to namespace
        const nspSocket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            auth: { token },
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

        nspSocket.on('message:new', (payload) => {
            handleMessage(payload);
        });

        socketRef.current = nspSocket;
    }, [handleMessage]);

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

    const markAsRead = useCallback((messageId: string) => {
        markAsReadMutation.mutate(messageId);
    }, [markAsReadMutation]);

    const markAllAsRead = useCallback(() => {
        const current = messages;
        queryClient.setQueryData(['messages', 'unread'], []);
        current.forEach(m => markAsReadMutation.mutate(m.id));
    }, [messages, markAsReadMutation, queryClient]);

    useEffect(() => {
        if (autoConnect) connect();
        return () => disconnect();
    }, [autoConnect, connect, disconnect]);

    return {
        messages,
        unreadCount: messages.length,
        isConnected,
        markAsRead,
        markAllAsRead,
        connect,
        disconnect,
    };
}
