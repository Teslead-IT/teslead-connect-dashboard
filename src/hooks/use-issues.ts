import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '@/services/issues.service';
import type { CreateIssuePayload, UpdateIssuePayload } from '@/types/issue';

export const issueKeys = {
    all: (projectId: string) => ['issues', projectId] as const,
    myIssues: (params?: Record<string, unknown>) => ['issues', 'my-issues', params] as const,
    detail: (issueId: string) => ['issues', 'detail', issueId] as const,
};

export function useProjectIssues(projectId: string) {
    return useQuery({
        queryKey: issueKeys.all(projectId),
        queryFn: () => issueService.getProjectIssues(projectId),
        enabled: !!projectId,
    });
}

export function useMyIssues(params?: {
    page?: number;
    limit?: number;
    search?: string;
    statusId?: string;
    projectId?: string;
}) {
    return useQuery({
        queryKey: issueKeys.myIssues(params),
        queryFn: () => issueService.getMyIssues(params),
        placeholderData: (previousData) => previousData,
    });
}

export function useIssueDetail(issueId: string) {
    return useQuery({
        queryKey: issueKeys.detail(issueId),
        queryFn: () => issueService.getIssueById(issueId),
        enabled: !!issueId,
    });
}

export function useCreateIssue(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateIssuePayload) => issueService.createIssue(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
        },
    });
}

export function useUpdateIssue(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ issueId, data }: { issueId: string; data: UpdateIssuePayload }) =>
            issueService.updateIssue(issueId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
            queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
        },
    });
}

export function useDeleteIssue(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (issueId: string) => issueService.deleteIssue(issueId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
            queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
        },
    });
}

export function useAddIssueAttachment(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ issueId, data }: { issueId: string; data: { fileName: string; fileUrl: string; mimeType?: string; fileSize?: number } }) =>
            issueService.addAttachment(issueId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
            queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
        },
    });
}

export function useRemoveIssueAttachment(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ issueId, attachmentId }: { issueId: string; attachmentId: string }) =>
            issueService.removeAttachment(issueId, attachmentId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
            queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
        },
    });
}
