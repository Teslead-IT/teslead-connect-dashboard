export type ReminderStatus = 'PENDING' | 'SENT' | 'CANCELLED';

export interface ReminderAssignee {
  assignedAt: string;
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

export interface Reminder {
  id: string;
  orgId: string;
  projectId?: string | null;
  taskId?: string | null;
  title: string;
  description?: string | null;
  remindAt: string;
  status: ReminderStatus;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; projectId?: string | null } | null;
  task?: { id: string; title: string; taskId?: string | null } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  assignees: ReminderAssignee[];
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  remindAt: string;
  projectId?: string;
  taskId?: string;
  assigneeIds?: string[];
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  remindAt?: string;
  projectId?: string | null;
  taskId?: string | null;
  status?: ReminderStatus;
  assigneeIds?: string[];
}

export interface ReminderListParams {
  page?: number;
  limit?: number;
  projectId?: string;
  taskId?: string;
  status?: ReminderStatus;
  mine?: boolean;
}

export interface PaginatedRemindersResponse {
  data: Reminder[];
  total: number;
  page: number;
  totalPages: number;
}
