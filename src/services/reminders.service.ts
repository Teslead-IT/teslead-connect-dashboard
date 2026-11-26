import { apiClient } from '@/lib/api-client';
import { useOrgStore } from '@/stores/orgStore';
import type {
  CreateReminderPayload,
  UpdateReminderPayload,
  Reminder,
  ReminderListParams,
  PaginatedRemindersResponse,
} from '@/types/reminder';

function getOrgId(): string {
  const orgId = useOrgStore.getState().activeOrgId ?? '';
  if (!orgId) console.warn('[RemindersService] activeOrgId is null');
  return orgId;
}

export const remindersApi = {
  async getAll(params?: ReminderListParams): Promise<PaginatedRemindersResponse> {
    const orgId = getOrgId();
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([_, v]) => v !== undefined && v !== null && v !== '',
          ),
        )
      : undefined;
    const { data } = await apiClient.get<PaginatedRemindersResponse>(
      `/organizations/${orgId}/reminders`,
      { params: cleanParams },
    );
    return data;
  },

  async getMy(params?: ReminderListParams): Promise<PaginatedRemindersResponse> {
    const orgId = getOrgId();
    const { data } = await apiClient.get<PaginatedRemindersResponse>(
      `/organizations/${orgId}/reminders/my`,
      { params },
    );
    return data;
  },

  async getByProject(
    projectId: string,
    params?: ReminderListParams,
  ): Promise<PaginatedRemindersResponse> {
    const orgId = getOrgId();
    const { data } = await apiClient.get<PaginatedRemindersResponse>(
      `/organizations/${orgId}/projects/${projectId}/reminders`,
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<Reminder> {
    const orgId = getOrgId();
    const { data } = await apiClient.get<Reminder>(
      `/organizations/${orgId}/reminders/${id}`,
    );
    return data;
  },

  async create(payload: CreateReminderPayload): Promise<Reminder> {
    const orgId = getOrgId();
    const { data } = await apiClient.post<Reminder>(
      `/organizations/${orgId}/reminders`,
      payload,
    );
    return data;
  },

  async update(id: string, payload: UpdateReminderPayload): Promise<Reminder> {
    const orgId = getOrgId();
    const { data } = await apiClient.patch<Reminder>(
      `/organizations/${orgId}/reminders/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    const orgId = getOrgId();
    await apiClient.delete(`/organizations/${orgId}/reminders/${id}`);
  },
};
