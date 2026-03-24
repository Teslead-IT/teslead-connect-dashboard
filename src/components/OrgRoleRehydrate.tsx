'use client';

import { useEffect } from 'react';
import { useUser } from '@/hooks/use-auth';
import { useOrgStore, type OrgRole } from '@/stores/orgStore';

/**
 * Rehydrates activeOrgRole from /auth/me after refresh.
 * Only activeOrgId is persisted; role is not. Once user is loaded, derive role
 * from user.memberships for the current activeOrgId and set it in the store.
 */
export function OrgRoleRehydrate() {
    const { data: user } = useUser();
    const activeOrgId = useOrgStore((s) => s.activeOrgId);
    const setActiveOrgRole = useOrgStore((s) => s.setActiveOrgRole);

    useEffect(() => {
        if (!user?.memberships || activeOrgId === null) return;
        const m = user.memberships.find((x) => x.orgId === activeOrgId);
        const role = m?.role?.toUpperCase?.() as OrgRole | undefined;
        if (role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER') {
            setActiveOrgRole(role);
        }
    }, [user?.memberships, activeOrgId, setActiveOrgRole]);

    return null;
}
