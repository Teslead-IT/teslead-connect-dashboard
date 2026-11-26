import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/services/reminders.service';
import { useOrgStore } from '@/stores/orgStore';
import type {
  CreateReminderPayload,
  UpdateReminderPayload,
  ReminderListParams,
} from '@/types/reminder';

export function useReminders(params?: ReminderListParams) {
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  return useQuery({
    queryKey: ['reminders', activeOrgId, params],
    queryFn: () => remindersApi.getAll(params),
    enabled: !!activeOrgId,
  });
}

export function useProjectReminders(
  projectId: string | undefined,
  params?: ReminderListParams,
) {
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  return useQuery({
    queryKey: ['reminders', activeOrgId, 'project', projectId, params],
    queryFn: () => remindersApi.getByProject(projectId!, params),
    enabled: !!activeOrgId && !!projectId,
  });
}

export function useTaskReminders(taskId: string | undefined) {
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  return useQuery({
    queryKey: ['reminders', activeOrgId, 'task', taskId],
    queryFn: () => remindersApi.getAll({ taskId, limit: 50 }),
    enabled: !!activeOrgId && !!taskId,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReminderPayload) => remindersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateReminderPayload & { id: string }) =>
      remindersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
