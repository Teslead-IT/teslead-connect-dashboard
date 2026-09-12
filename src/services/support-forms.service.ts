import { apiClient } from '@/lib/api-client';
import { useOrgStore } from '@/stores/orgStore';

function getOrgId(): string {
    const orgId = useOrgStore.getState().activeOrgId ?? '';
    if (!orgId) console.warn('[SupportFormsService] activeOrgId is null');
    return orgId;
}

export type SupportMode = 'ONLINE' | 'ONSITE';

export interface SupportFormItem {
    id?: string;
    sNo?: number;
    purpose: string;
    supportMode: SupportMode;
    supportedBy: string;
    startDate?: string | null;
    endDate?: string | null;
}

export interface SupportForm {
    id: string;
    orgId: string;
    projectId?: string | null;
    projectName: string;
    projectStartDate?: string | null;
    projectCompletionDate?: string | null;
    createdById?: string | null;
    isDeleted: boolean;
    deletedAt?: string | null;
    deletedById?: string | null;
    createdAt: string;
    updatedAt: string;
    items: SupportFormItem[];
    project?: {
        id: string;
        name: string;
        projectId?: string;
    } | null;
}

export interface CreateSupportFormPayload {
    projectName: string;
    projectId?: string;
    projectStartDate?: string;
    projectCompletionDate?: string;
    items?: Array<{
        sNo?: number;
        purpose: string;
        supportMode: SupportMode;
        supportedBy: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export interface UpdateSupportFormPayload extends Partial<CreateSupportFormPayload> {}

export interface PaginatedSupportFormsResponse {
    data: SupportForm[];
    total: number;
    page: number;
    totalPages: number;
}

export const supportFormsApi = {
    /**
     * List all support forms with filters & pagination
     */
    async getAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
        projectId?: string;
    }): Promise<PaginatedSupportFormsResponse> {
        const orgId = getOrgId();
        const cleanParams = params
            ? Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            )
            : undefined;

        const { data } = await apiClient.get<PaginatedSupportFormsResponse>(
            `/organizations/${orgId}/support-forms`,
            { params: cleanParams }
        );
        return data;
    },

    /**
     * Get a single support form by ID
     */
    async getById(id: string): Promise<SupportForm> {
        const orgId = getOrgId();
        const { data } = await apiClient.get<SupportForm>(
            `/organizations/${orgId}/support-forms/${id}`
        );
        return data;
    },

    /**
     * Create a new support form
     */
    async create(payload: CreateSupportFormPayload): Promise<SupportForm> {
        const orgId = getOrgId();
        const { data } = await apiClient.post<SupportForm>(
            `/organizations/${orgId}/support-forms`,
            payload
        );
        return data;
    },

    /**
     * Update an existing support form
     */
    async update(id: string, payload: UpdateSupportFormPayload): Promise<SupportForm> {
        const orgId = getOrgId();
        const { data } = await apiClient.patch<SupportForm>(
            `/organizations/${orgId}/support-forms/${id}`,
            payload
        );
        return data;
    },

    /**
     * Soft delete a support form
     */
    async remove(id: string): Promise<{ message: string }> {
        const orgId = getOrgId();
        const { data } = await apiClient.delete<{ message: string }>(
            `/organizations/${orgId}/support-forms/${id}`
        );
        return data;
    },
};
