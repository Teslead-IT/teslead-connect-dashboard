import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER'

interface OrgState {
  activeOrgId: string | null
  activeOrgRole: OrgRole | null
  isSwitching: boolean
  switchingLabel: string
  setActiveOrg: (orgId: string) => void
  setActiveOrgRole: (role: OrgRole | null) => void
  setOrg: (orgId: string, role?: OrgRole | null) => void
  setSwitching: (v: boolean, label?: string) => void
  clearOrg: () => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      activeOrgId: null,
      activeOrgRole: null,
      isSwitching: false,
      switchingLabel: 'Switching organization',

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

      setSwitching: (v: boolean, label?: string) =>
        set({
          isSwitching: v,
          switchingLabel: label || 'Switching organization'
        }),

      clearOrg: () =>
        set({
          activeOrgId: null,
          activeOrgRole: null,
          isSwitching: false,
          switchingLabel: 'Switching organization',
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