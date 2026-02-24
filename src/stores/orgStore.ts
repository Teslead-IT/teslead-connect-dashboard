import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER'

interface OrgState {
  activeOrgId: string | null
  activeOrgRole: OrgRole | null
  isSwitching: boolean
  setActiveOrg: (orgId: string) => void
  setActiveOrgRole: (role: OrgRole | null) => void
  setOrg: (orgId: string, role?: OrgRole | null) => void
  setSwitching: (v: boolean) => void
  clearOrg: () => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      activeOrgId: null,
      activeOrgRole: null,
      isSwitching: false,

      setActiveOrg: (orgId: string) =>
        set({ activeOrgId: orgId }),

      setActiveOrgRole: (role: OrgRole | null) =>
        set({ activeOrgRole: role }),

      setOrg: (orgId: string, role?: OrgRole | null) =>
        set({
          activeOrgId: orgId,
          activeOrgRole:
            role !== undefined ? role : get().activeOrgRole,
        }),

      setSwitching: (v: boolean) =>
        set({ isSwitching: v }),

      clearOrg: () =>
        set({
          activeOrgId: null,
          activeOrgRole: null,
          isSwitching: false,
        }),
    }),
    {
      name: 'org-context',
      partialize: (state) => ({
        activeOrgId: state.activeOrgId, // persist ONLY orgId
      }),
    }
  )
)