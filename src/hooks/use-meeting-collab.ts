/**
 * Meeting collaboration socket. COPY connect pattern from use-presence.ts.
 * Namespace: /meetings — join only when meetingId is set (not create mode).
 * Soft lock + A1 cell commit (Sheets-style LWW on leave).
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';
import { tokenStorage } from '@/lib/token-storage';
import { useOrgStore } from '@/stores/orgStore';

export type MeetingCollabViewer = {
    userId: string;
    userName: string;
    focused?: { rowId: string; field: string } | null;
};

export type RemoteFocus = {
    userId: string;
    userName: string;
    rowId: string;
    field: string;
};

export type ContentUpdatedPayload = {
    meetingId: string;
    updatedBy: string;
    updatedByName?: string;
    updatedAt: string;
    content: any;
};

export type CellCommitPayload = {
    meetingId: string;
    rowId: string;
    field: string;
    value: string;
    userId: string;
    userName: string;
    serverTs: number;
    clientTs?: number;
};

type UseMeetingCollabOptions = {
    userId?: string | null;
    userName?: string | null;
    enabled?: boolean;
    onContentUpdated?: (payload: ContentUpdatedPayload) => void;
    /** A1: apply remote cell value even if locally focused */
    onCellCommit?: (payload: CellCommitPayload) => void;
};

function cellKey(rowId: string, field: string) {
    return `${rowId}::${field}`;
}

export function useMeetingCollab(
    meetingId: string | null | undefined,
    options: UseMeetingCollabOptions = {},
) {
    const { userId, userName, enabled = true, onContentUpdated, onCellCommit } = options;
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const socketRef = useRef<Socket | null>(null);
    const onContentUpdatedRef = useRef(onContentUpdated);
    const onCellCommitRef = useRef(onCellCommit);
    onContentUpdatedRef.current = onContentUpdated;
    onCellCommitRef.current = onCellCommit;

    const lastCommittedRef = useRef<Record<string, string>>({});

    const [viewers, setViewers] = useState<MeetingCollabViewer[]>([]);
    const [remoteFocusByCell, setRemoteFocusByCell] = useState<Record<string, RemoteFocus>>({});
    const [isConnected, setIsConnected] = useState(false);

    const canConnect = !!(enabled && meetingId && userId && activeOrgId);

    const applyPresence = useCallback((list: MeetingCollabViewer[]) => {
        setViewers(list);
        const next: Record<string, RemoteFocus> = {};
        for (const v of list) {
            if (!v.focused?.rowId || !v.focused?.field) continue;
            if (userId && v.userId === userId) continue;
            next[cellKey(v.focused.rowId, v.focused.field)] = {
                userId: v.userId,
                userName: v.userName,
                rowId: v.focused.rowId,
                field: v.focused.field,
            };
        }
        setRemoteFocusByCell(next);
    }, [userId]);

    useEffect(() => {
        if (!canConnect) {
            if (socketRef.current) {
                socketRef.current.emit('meeting:leave', { meetingId });
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setViewers([]);
            setRemoteFocusByCell({});
            setIsConnected(false);
            return;
        }

        const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/api\/?$/, '');
        const namespace = API_CONFIG.WEBSOCKET?.MEETINGS_NAMESPACE ?? '/meetings';
        const socketUrl = `${baseUrl}${namespace}`;
        const token = tokenStorage.getToken(API_CONFIG.STORAGE.ACCESS_TOKEN);

        const socket = io(socketUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            auth: { token, orgId: activeOrgId, userId },
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        const join = () => {
            socket.emit(
                'meeting:join',
                { meetingId, userName: userName || 'Someone' },
                (ack?: { ok?: boolean; viewers?: MeetingCollabViewer[] }) => {
                    if (ack?.viewers) applyPresence(ack.viewers);
                },
            );
        };

        socket.on('connect', () => {
            setIsConnected(true);
            join();
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('meeting:presence', (payload: { viewers?: MeetingCollabViewer[] }) => {
            if (payload?.viewers) applyPresence(payload.viewers);
        });

        socket.on('meeting:focus', (payload: RemoteFocus & { meetingId?: string }) => {
            if (!payload?.rowId || !payload?.field) return;
            if (userId && payload.userId === userId) return;
            setRemoteFocusByCell((prev) => ({
                ...prev,
                [cellKey(payload.rowId, payload.field)]: {
                    userId: payload.userId,
                    userName: payload.userName,
                    rowId: payload.rowId,
                    field: payload.field,
                },
            }));
        });

        socket.on('meeting:blur', (payload: { userId?: string; rowId?: string; field?: string }) => {
            if (!payload?.userId) return;
            setRemoteFocusByCell((prev) => {
                const next = { ...prev };
                for (const [k, v] of Object.entries(next)) {
                    if (v.userId === payload.userId) {
                        if (!payload.rowId || (v.rowId === payload.rowId && v.field === payload.field)) {
                            delete next[k];
                        }
                    }
                }
                return next;
            });
        });

        socket.on('meeting:cell_commit', (payload: CellCommitPayload) => {
            if (!payload?.rowId || !payload?.field) return;
            const key = cellKey(payload.rowId, payload.field);
            lastCommittedRef.current[key] = payload.value ?? '';
            // Clear remote focus badge for that cell / user
            setRemoteFocusByCell((prev) => {
                const next = { ...prev };
                const existing = next[key];
                if (existing && existing.userId === payload.userId) {
                    delete next[key];
                }
                return next;
            });
            onCellCommitRef.current?.(payload);
        });

        socket.on('meeting:content_updated', (payload: ContentUpdatedPayload) => {
            onContentUpdatedRef.current?.(payload);
        });

        const heartbeat = setInterval(() => {
            if (socket.connected) {
                socket.emit('meeting:heartbeat', { meetingId });
            }
        }, 20_000);

        return () => {
            clearInterval(heartbeat);
            if (socket.connected) {
                socket.emit('meeting:leave', { meetingId });
            }
            socket.disconnect();
            if (socketRef.current === socket) socketRef.current = null;
            setIsConnected(false);
            setViewers([]);
            setRemoteFocusByCell({});
        };
    }, [canConnect, meetingId, userId, userName, activeOrgId, applyPresence]);

    const setFocus = useCallback(
        (rowId: string, field: string) => {
            const socket = socketRef.current;
            if (!socket?.connected || !meetingId) return;
            socket.emit('meeting:focus', {
                meetingId,
                rowId,
                field,
                userName: userName || 'Someone',
            });
        },
        [meetingId, userName],
    );

    const clearFocus = useCallback(
        (rowId?: string, field?: string) => {
            const socket = socketRef.current;
            if (!socket?.connected || !meetingId) return;
            socket.emit('meeting:blur', { meetingId, rowId, field });
        },
        [meetingId],
    );

    /**
     * Sheets-style: commit cell value when leaving the field.
     * Skips emit if value unchanged since last commit.
     */
    const commitCell = useCallback(
        (rowId: string, field: string, value: string) => {
            const socket = socketRef.current;
            if (!socket?.connected || !meetingId) return false;
            const key = cellKey(rowId, field);
            const normalized = value ?? '';
            if (lastCommittedRef.current[key] === normalized) {
                clearFocus(rowId, field);
                return false;
            }
            lastCommittedRef.current[key] = normalized;
            socket.emit('meeting:cell_commit', {
                meetingId,
                rowId,
                field,
                value: normalized,
                clientTs: Date.now(),
                userName: userName || 'Someone',
            });
            return true;
        },
        [meetingId, userName, clearFocus],
    );

    const otherViewers = viewers.filter((v) => v.userId !== userId);

    return {
        isConnected,
        viewers,
        otherViewers,
        remoteFocusByCell,
        setFocus,
        clearFocus,
        commitCell,
        getRemoteFocus: (rowId: string, field: string) =>
            remoteFocusByCell[cellKey(rowId, field)] || null,
    };
}
