/**
 * Presence socket ref and disconnect. Used by useSwitchOrg to disconnect on org change.
 * The actual socket is set from use-presence hook when connecting.
 */

import type { Socket } from 'socket.io-client';
import { usePresenceStore } from '@/stores/presenceStore';

let presenceSocket: Socket | null = null;

export function setPresenceSocket(socket: Socket | null) {
    presenceSocket = socket;
}

export function disconnectPresenceSocket() {
    if (presenceSocket) {
        presenceSocket.removeAllListeners();
        presenceSocket.disconnect();
        presenceSocket = null;
    }
    usePresenceStore.getState().clearPresence();
}
