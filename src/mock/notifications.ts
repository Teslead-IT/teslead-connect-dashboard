import type { Notification } from '@/context/NotificationContext';

export const mockNotifications: Notification[] = [
    {
        id: 'n1',
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned to "Performance Optimization"',
        projectId: 'p1',
        taskId: 't4',
        read: false,
        timestamp: new Date('2026-01-07T10:30:00'),
    },
    {
        id: 'n2',
        type: 'status_changed',
        title: 'Task Status Updated',
        message: '"Design Homepage Mockup" has been marked as completed',
        projectId: 'p1',
        taskId: 't1',
        read: false,
        timestamp: new Date('2026-01-07T09:15:00'),
    },
    {
        id: 'n3',
        type: 'comment_added',
        title: 'New Comment',
        message: 'Priya Sharma commented on "Implement Responsive Navigation"',
        projectId: 'p1',
        taskId: 't2',
        read: true,
        timestamp: new Date('2026-01-06T16:45:00'),
    },
    {
        id: 'n4',
        type: 'due_date_reminder',
        title: 'Due Date Approaching',
        message: '"Set Up CI/CD Pipeline" is due in 2 days',
        projectId: 'p1',
        taskId: 't3',
        read: true,
        timestamp: new Date('2026-01-06T08:00:00'),
    },
    {
        id: 'n5',
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned to "API Gateway Setup"',
        projectId: 'p3',
        taskId: 't9',
        read: true,
        timestamp: new Date('2026-01-05T14:20:00'),
    },
];

export function getNotificationsByProject(projectId: string): Notification[] {
    return mockNotifications.filter((notification) => notification.projectId === projectId);
}

export function getUnreadNotifications(): Notification[] {
    return mockNotifications.filter((notification) => !notification.read);
}
