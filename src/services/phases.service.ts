import { apiClient } from '@/lib/api-client';
import type {
    Phase,
    TaskList,
    PhaseWithTaskLists,
    CreatePhasePayload,
    UpdatePhasePayload,
    CreateTaskListPayload,
    UpdateTaskListPayload,
    ReorderPayload,
    MoveTaskPayload,
} from '@/types/phase';

/** Build task tree from flat list (by parentId). Returns root tasks with children nested. */
function buildTaskTree(flatTasks: any[]): any[] {
    if (!flatTasks?.length) return [];
    const byId = new Map<string, any>();
    flatTasks.forEach((t) => {
        byId.set(t.id, { ...t, children: t.children || [] });
    });
    const roots: any[] = [];
    const seen = new Set<string>();
    flatTasks.forEach((t) => {
        const node = byId.get(t.id)!;
        if (seen.has(t.id)) return;
        const parentId = t.parentId ?? t.parent_task_id;
        if (!parentId || !byId.has(parentId)) {
            roots.push(node);
            seen.add(t.id);
        } else {
            const parent = byId.get(parentId);
            if (parent) {
                parent.children = parent.children || [];
                if (!parent.children.some((c: any) => c.id === node.id)) {
                    parent.children.push(node);
                }
                seen.add(t.id);
            } else {
                roots.push(node);
                seen.add(t.id);
            }
        }
    });
    return roots.length ? roots : flatTasks;
}

/** Normalize API response - backend may return phaseName/taskListName or name.
 * Excludes synthetic "UNASSIGNED" phase (not in DB, placeholder for orphan tasks).
 * Builds task tree from flat parentId when children are not nested. */
function normalizeStructuredData(raw: any[]): PhaseWithTaskLists[] {
    return (raw || [])
        .filter((p: any) => {
            const name = (p.name ?? p.phaseName ?? '').trim();
            return name.toLowerCase() !== 'unassigned';
        })
        .map((p: any) => {
        const phase: PhaseWithTaskLists = {
            id: p.id ?? p.phaseId,
            name: p.name ?? p.phaseName ?? '',
            projectId: p.projectId ?? '',
            startDate: p.startDate ?? null,
            endDate: p.endDate ?? null,
            access: p.access ?? 'INTERNAL',
            orderIndex: p.orderIndex ?? 0,
            createdAt: p.createdAt ?? '',
            updatedAt: p.updatedAt ?? '',
            taskLists: (p.taskLists ?? []).map((tl: any) => {
                const rawTasks = tl.tasks ?? [];
                const hasPreNested = rawTasks.some((t: any) => Array.isArray(t.children) && t.children.length > 0);
                const tasks = hasPreNested ? rawTasks : buildTaskTree(rawTasks);
                return {
                    id: tl.id ?? tl.taskListId,
                    name: tl.name ?? tl.taskListName ?? '',
                    projectId: tl.projectId ?? p.projectId ?? '',
                    phaseId: tl.phaseId ?? p.id ?? p.phaseId,
                    access: tl.access ?? 'INTERNAL',
                    orderIndex: tl.orderIndex ?? 0,
                    createdAt: tl.createdAt ?? '',
                    updatedAt: tl.updatedAt ?? '',
                    tasks,
                };
            }),
        };
        return phase;
    });
}

export const phaseService = {
    async getStructuredData(projectId: string): Promise<PhaseWithTaskLists[]> {
        const res = await apiClient.get<any>(`/projects/${projectId}/tasks-structured`);
        const data = res?.data ?? res;
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.phases ?? []);
        return normalizeStructuredData(Array.isArray(arr) ? arr : []);
    },

    async createPhase(payload: CreatePhasePayload): Promise<Phase> {
        const { data } = await apiClient.post<Phase>('/phases', payload);
        return data;
    },

    async updatePhase(phaseId: string, payload: UpdatePhasePayload): Promise<Phase> {
        const { data } = await apiClient.patch<Phase>(`/phases/${phaseId}`, payload);
        return data;
    },

    async deletePhase(phaseId: string): Promise<void> {
        await apiClient.delete(`/phases/${phaseId}`);
    },

    async reorderPhases(payload: ReorderPayload): Promise<void> {
        await apiClient.patch('/phases/reorder', payload);
    },

    async createTaskList(payload: CreateTaskListPayload): Promise<TaskList> {
        const { data } = await apiClient.post<TaskList>('/tasklists', payload);
        return data;
    },

    async updateTaskList(taskListId: string, payload: UpdateTaskListPayload): Promise<TaskList> {
        const { data } = await apiClient.patch<TaskList>(`/tasklists/${taskListId}`, payload);
        return data;
    },

    async deleteTaskList(taskListId: string): Promise<void> {
        await apiClient.delete(`/tasklists/${taskListId}`);
    },

    async reorderTaskLists(payload: ReorderPayload): Promise<void> {
        await apiClient.patch('/tasklists/reorder', payload);
    },

    async moveTask(taskId: string, payload: MoveTaskPayload): Promise<void> {
        await apiClient.patch(`/tasks/${taskId}/move`, payload);
    },
};
