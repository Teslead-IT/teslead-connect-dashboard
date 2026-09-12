import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    supportFormsApi,
    SupportForm,
    SupportFormItem,
    SupportMode,
    CreateSupportFormPayload,
    UpdateSupportFormPayload,
    PaginatedSupportFormsResponse,
} from '@/services/support-forms.service';
import { useOrgStore } from '@/stores/orgStore';

export type {
    SupportForm,
    SupportFormItem,
    SupportMode,
    CreateSupportFormPayload,
    UpdateSupportFormPayload,
    PaginatedSupportFormsResponse,
};

/**
 * Hook to fetch all support forms (paginated, search, filter)
 */
export function useSupportForms(params?: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
}) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: ['support-forms', activeOrgId, params],
        queryFn: () => supportFormsApi.getAll(params),
        enabled: !!activeOrgId,
    });
}

/**
 * Hook to fetch a single support form by ID
 */
export function useSupportForm(id?: string | null) {
    const activeOrgId = useOrgStore((s) => s.activeOrgId);

    return useQuery({
        queryKey: ['support-form', activeOrgId, id],
        queryFn: () => supportFormsApi.getById(id!),
        enabled: !!id && !!activeOrgId,
    });
}

/**
 * Hook to create a new support form
 */
export function useCreateSupportForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateSupportFormPayload) => supportFormsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-forms'] });
        },
    });
}

/**
 * Hook to update an existing support form
 */
export function useUpdateSupportForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSupportFormPayload }) =>
            supportFormsApi.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['support-forms'] });
            queryClient.invalidateQueries({ queryKey: ['support-form', variables.id] });
        },
    });
}

/**
 * Hook to soft-delete a support form
 */
export function useDeleteSupportForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => supportFormsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-forms'] });
        },
    });
}
