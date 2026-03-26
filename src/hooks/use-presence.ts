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
    const { setPresence, setAllPresences, clearPresence } = usePresenceStore();
    const presences = usePresenceStore((s) => s.presences);
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
            // console.log('Presence socket connected');
        });

        // Listen for batch list update (if backend sends it)
        socket.on('presence:list', (data: Record<string, any>) => {
            setAllPresences(data);
        });

        // Listen for individual updates
        socket.on('presence_updated', (data: { userId: string; status: string; message?: string; updatedAt?: string }) => {
            const { userId, status, message, updatedAt } = data;
            setPresence(userId, {
                status: status as any,
                message,
                updatedAt,
            });
        });

        socket.on('disconnect', () => {
            clearPresence();
        });

        setPresenceSocket(socket);
        return () => {
            socket.disconnect();
            setPresenceSocket(null);
            connectedOrgRef.current = null;
        };
    }, [enabled, activeOrgId, setPresence, setAllPresences, clearPresence]);

    return presences;
}

