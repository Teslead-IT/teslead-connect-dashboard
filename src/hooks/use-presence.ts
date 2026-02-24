/**
 * Presence WebSocket. Connect only when orgSettings.enableUserPresence === true.
 * On org switch: disconnect (called from useSwitchOrg). Reconnect with new org in same hook when enabled.
 */

'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';
import { tokenStorage } from '@/lib/token-storage';
import { useOrgStore } from '@/stores/orgStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { setPresenceSocket, disconnectPresenceSocket } from '@/lib/presence-socket';

export { disconnectPresenceSocket } from '@/lib/presence-socket';

export function usePresence() {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const { data: orgSettings } = useOrgSettings();
    const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
    const enabled = !!activeOrgId && !!orgSettings?.enableUserPresence;
    const connectedOrgRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            disconnectPresenceSocket();
            connectedOrgRef.current = null;
            return;
        }
        if (connectedOrgRef.current === activeOrgId) return;

        disconnectPresenceSocket();
        connectedOrgRef.current = activeOrgId ?? null;

        const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/api\/?$/, '');
        const namespace = API_CONFIG.WEBSOCKET?.PRESENCE_NAMESPACE ?? '/presence';
        const socketUrl = `${baseUrl}${namespace}`;
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);

        const socket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            auth: { token, orgId: activeOrgId },
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            // Backend may send initial list or updates via 'presence:list' / 'presence:update'
        });
        socket.on('presence:list', (userIds: string[]) => {
            setOnlineUsers(Array.isArray(userIds) ? userIds : []);
        });
        socket.on('presence:update', (payload: { onlineUserIds?: string[] }) => {
            if (Array.isArray(payload?.onlineUserIds)) {
                setOnlineUsers(payload.onlineUserIds);
            }
        });
        socket.on('disconnect', () => {
            setOnlineUsers([]);
        });

        setPresenceSocket(socket);
        return () => {
            socket.disconnect();
            setPresenceSocket(null);
            connectedOrgRef.current = null;
        };
    }, [enabled, activeOrgId, setOnlineUsers]);

    return usePresenceStore((s) => s.onlineUserIds);
}
