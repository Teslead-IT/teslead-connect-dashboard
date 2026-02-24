/**
 * Presence (online users). NOT persisted.
 * Cleared and reconnected on org switch when enableUserPresence is true.
 */

import { create } from 'zustand';

interface PresenceState {
    onlineUserIds: string[];
    setOnlineUsers: (userIds: string[]) => void;
    clearPresence: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
    onlineUserIds: [],
    setOnlineUsers: (userIds) => set({ onlineUserIds: userIds }),
    clearPresence: () => set({ onlineUserIds: [] }),
}));
