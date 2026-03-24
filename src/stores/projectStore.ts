/**
 * Single source of truth for active project context.
 * RBAC: activeProjectRole drives Create/Edit/Delete Task UI.
 * Cleared on org switch to avoid cross-tenant state.
 */

import { create } from 'zustand';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface ProjectState {
    activeProjectId: string | null;
    activeProjectRole: ProjectRole | null;
    setProject: (projectId: string, role: ProjectRole) => void;
    clearProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    activeProjectId: null,
    activeProjectRole: null,
    setProject: (projectId: string, role: ProjectRole) =>
        set({ activeProjectId: projectId, activeProjectRole: role }),
    clearProject: () => set({ activeProjectId: null, activeProjectRole: null }),
}));
