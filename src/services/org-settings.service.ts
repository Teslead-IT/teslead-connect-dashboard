/**
 * Organization settings API.
 * Tenant context via x-org-id header only (no orgId in body).
 */

import { apiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import type { OrgSettings, UpdateOrgSettingsPayload } from '@/types/org-settings';

export const orgSettingsApi = {
    async get(): Promise<OrgSettings> {
        const { data } = await apiClient.get<OrgSettings>(API_CONFIG.ENDPOINTS.ORG.SETTINGS);
        return data;
    },

    async update(payload: UpdateOrgSettingsPayload): Promise<OrgSettings> {
        const { data } = await apiClient.patch<OrgSettings>(API_CONFIG.ENDPOINTS.ORG.SETTINGS, payload);
        return data;
    },
};
