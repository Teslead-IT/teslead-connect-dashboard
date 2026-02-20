/**
 * Types for Analytics API (dashboard, task-lists, users)
 * @see ANALYTICS_API.md
 */

export interface DashboardOverview {
    totalProjects: number;
    totalTasks: number;
    totalPhases: number;
    totalTaskLists: number;
    assignedUsersCount: number;
    tasksOverdue: number;
    tasksDueSoon: number;
    tasksDueToday: number;
    phasesEnded: number;
    phasesEndingSoon: number;
    tasksCompleted: number;
    tasksPending: number;
}

export interface MineDashboardOverview {
    myProjectsCount: number;
    myTasksAssigned: number;
    myTasksOverdue: number;
    myTasksDueSoon: number;
    myTasksDueToday: number;
    myTasksCompleted: number;
    myTasksPending: number;
}

export interface LabelValue {
    label: string;
    value: number;
}

export interface PeriodValue {
    period: string;
    value: number;
}

export interface DashboardResponse {
    overview: DashboardOverview;
    projectsByStatus: LabelValue[];
    projectsByAccess: LabelValue[];
    tasksByStatus: LabelValue[];
    tasksByPriority: LabelValue[];
    tasksByAssignee: LabelValue[];
    tasksByDueBucket: LabelValue[];
    phaseEndingsByMonth: PeriodValue[];
    taskDueCountByWeek: PeriodValue[];
}

export interface MineDashboardResponse {
    overview: MineDashboardOverview;
    myTasksByStatus: LabelValue[];
    myTasksByPriority: LabelValue[];
    myTasksByDueBucket: LabelValue[];
    myTasksByProject: LabelValue[];
}

export interface TaskListItemAssignee {
    id: string;
    name: string;
}

export interface TaskListItem {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    statusName: string;
    dueDate: string | null;
    priority: number;
    priorityLabel: string;
    assignees: TaskListItemAssignee[];
    phaseName?: string;
    taskListName?: string;
}

export interface TaskListProject {
    id: string;
    name: string;
    status: string;
    access: string;
    taskCount: number;
    tasksOverdue: number;
    tasksDueSoon: number;
}

export interface TaskListResponse {
    items: TaskListItem[];
    total: number;
    projects: TaskListProject[];
}

export interface DashboardUser {
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
    tasksAssignedCount: number;
    tasksCompleted: number;
    tasksPending: number;
}

export interface DashboardUsersResponse {
    users: DashboardUser[];
    total: number;
}

export type TaskListBucket = 'all' | 'overdue' | 'due_soon' | 'due_today';
