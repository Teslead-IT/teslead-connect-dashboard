/**
 * Pending org switch when timer is running without task.
 * User must assign task (or cancel) before switching.
 */

import { create } from 'zustand';
import type { OrgRole } from './orgStore';

interface PendingOrgSwitch {
    orgId: string;
    role?: OrgRole;
}

interface OrgSwitchState {
    pending: PendingOrgSwitch | null;
    setPending: (orgId: string, role?: OrgRole) => void;
    clearPending: () => void;
}

export const useOrgSwitchStore = create<OrgSwitchState>((set) => ({
    pending: null,
    setPending: (orgId, role) => set({ pending: { orgId, role } }),
    clearPending: () => set({ pending: null }),
}));
