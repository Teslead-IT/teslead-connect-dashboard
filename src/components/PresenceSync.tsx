'use client';

import { usePresence } from '@/hooks/use-presence';

/**
 * PresenceSync component
 * Calls usePresence hook to maintain websocket connection for real-time status updates.
 * Should be placed at the top level of the dashboard or overall app layout.
 */
export function PresenceSync() {
    usePresence();
    return null;
}
