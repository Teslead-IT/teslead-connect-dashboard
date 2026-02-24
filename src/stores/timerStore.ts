/**
 * Timer state (task-based). NOT persisted.
 * Cleared on org switch. Backend is source of truth.
 */

import { create } from 'zustand';
import type { ActiveTimer } from '@/types/timer';

interface TimerState {
    activeTimer: ActiveTimer | null;
    isRunning: boolean;
    setTimer: (timer: ActiveTimer | null) => void;
    clearTimer: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
    activeTimer: null,
    isRunning: false,
    setTimer: (timer) => set({
        activeTimer: timer,
        isRunning: !!timer,
    }),
    clearTimer: () => set({ activeTimer: null, isRunning: false }),
}));
