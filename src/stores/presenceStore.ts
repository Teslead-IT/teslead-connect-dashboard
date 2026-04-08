/**
 * Presence (online users). NOT persisted.
 * Cleared and reconnected on org switch when enableUserPresence is true.
 */

import { create } from 'zustand';

export type UserPresenceStatus = 'ONLINE' | 'OFFLINE' | 'LUNCH' | 'BREAK' | 'WFH' | 'CHECKED_OUT';

export interface UserPresence {
    status: UserPresenceStatus;
    message?: string;
    updatedAt?: string;
}

interface PresenceState {
    // Map of userId to presence details
    presences: Record<string, UserPresence>;
    setPresence: (userId: string, presence: UserPresence) => void;
    setAllPresences: (presences: Record<string, UserPresence>) => void;
    clearPresence: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
    presences: {},
    setPresence: (userId, presence) =>
        set((state) => ({
            presences: {
                ...state.presences,
                [userId]: presence,
            },
        })),
    setAllPresences: (presences) => set({ presences }),
    clearPresence: () => set({ presences: {} }),
}));

