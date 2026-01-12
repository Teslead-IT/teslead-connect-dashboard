export type TaskStatus = 'open' | 'in-progress' | 'testing' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string;
    creatorId: string;
    startDate: Date;
    dueDate: Date;
    tags: string[];
    subtasks?: Task[];
    parentTaskId?: string;
    estimatedHours?: number;
    actualHours?: number;
    completedAt?: Date;
}

export const mockTasks: Task[] = [
    // Website Development Project Tasks
    {
        id: 't1',
        projectId: 'p1',
        title: 'Design Homepage Mockup',
        description: 'Create high-fidelity mockup for the new homepage',
        status: 'completed',
        priority: 'high',
        assigneeId: '2',
        creatorId: '1',
        startDate: new Date('2026-01-05'),
        dueDate: new Date('2026-01-15'),
        tags: ['design', 'ui/ux'],
        estimatedHours: 20,
        actualHours: 22,
        completedAt: new Date('2026-01-14'),
    },
    {
        id: 't2',
        projectId: 'p1',
        title: 'Implement Responsive Navigation',
        description: 'Build mobile-friendly navigation with hamburger menu',
        status: 'in-progress',
        priority: 'high',
        assigneeId: '3',
        creatorId: '1',
        startDate: new Date('2026-01-10'),
        dueDate: new Date('2026-01-25'),
        tags: ['frontend', 'responsive'],
        estimatedHours: 16,
        actualHours: 10,
    },
    {
        id: 't3',
        projectId: 'p1',
        title: 'Set Up CI/CD Pipeline',
        description: 'Configure automated deployment workflow',
        status: 'testing',
        priority: 'medium',
        assigneeId: '3',
        creatorId: '1',
        startDate: new Date('2026-01-08'),
        dueDate: new Date('2026-01-20'),
        tags: ['devops', 'automation'],
        estimatedHours: 12,
    },
    {
        id: 't4',
        projectId: 'p1',
        title: 'Performance Optimization',
        description: 'Optimize website loading time and Core Web Vitals',
        status: 'open',
        priority: 'medium',
        assigneeId: '2',
        creatorId: '1',
        startDate: new Date('2026-01-20'),
        dueDate: new Date('2026-02-05'),
        tags: ['performance', 'optimization'],
        estimatedHours: 24,
    },

    // Mobile App Development Tasks
    {
        id: 't5',
        projectId: 'p2',
        title: 'User Authentication Flow',
        description: 'Implement login, signup, and password reset',
        status: 'in-progress',
        priority: 'high',
        assigneeId: '4',
        creatorId: '2',
        startDate: new Date('2026-01-03'),
        dueDate: new Date('2026-01-18'),
        tags: ['auth', 'security'],
        estimatedHours: 28,
    },
    {
        id: 't6',
        projectId: 'p2',
        title: 'Push Notifications Setup',
        description: 'Integrate Firebase Cloud Messaging',
        status: 'open',
        priority: 'medium',
        assigneeId: '5',
        creatorId: '2',
        startDate: new Date('2026-01-15'),
        dueDate: new Date('2026-01-30'),
        tags: ['notifications', 'firebase'],
        estimatedHours: 16,
    },
    {
        id: 't7',
        projectId: 'p2',
        title: 'Offline Mode Support',
        description: 'Enable app functionality without internet connection',
        status: 'open',
        priority: 'low',
        assigneeId: '4',
        creatorId: '2',
        startDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-20'),
        tags: ['offline', 'sync'],
        estimatedHours: 32,
    },

    // Backend API Refactor Tasks
    {
        id: 't8',
        projectId: 'p3',
        title: 'User Service Migration',
        description: 'Extract user management into separate microservice',
        status: 'completed',
        priority: 'high',
        assigneeId: '3',
        creatorId: '3',
        startDate: new Date('2025-11-15'),
        dueDate: new Date('2025-12-10'),
        tags: ['microservices', 'backend'],
        estimatedHours: 40,
        actualHours: 42,
        completedAt: new Date('2025-12-08'),
    },
    {
        id: 't9',
        projectId: 'p3',
        title: 'API Gateway Setup',
        description: 'Configure Kong API gateway for service routing',
        status: 'in-progress',
        priority: 'high',
        assigneeId: '4',
        creatorId: '3',
        startDate: new Date('2025-12-15'),
        dueDate: new Date('2026-01-15'),
        tags: ['gateway', 'infrastructure'],
        estimatedHours: 24,
    },
    {
        id: 't10',
        projectId: 'p3',
        title: 'Load Testing',
        description: 'Perform stress testing on new architecture',
        status: 'testing',
        priority: 'medium',
        assigneeId: '3',
        creatorId: '3',
        startDate: new Date('2026-01-10'),
        dueDate: new Date('2026-01-25'),
        tags: ['testing', 'performance'],
        estimatedHours: 16,
    },
];

// Subtasks for "Implement Responsive Navigation"
export const mockSubtasks: Task[] = [
    {
        id: 't2-1',
        parentTaskId: 't2',
        projectId: 'p1',
        title: 'Design mobile menu component',
        description: 'Create reusable mobile menu component',
        status: 'completed',
        priority: 'medium',
        assigneeId: '3',
        creatorId: '3',
        startDate: new Date('2026-01-10'),
        dueDate: new Date('2026-01-15'),
        tags: ['component'],
        estimatedHours: 4,
        actualHours: 5,
        completedAt: new Date('2026-01-14'),
    },
    {
        id: 't2-2',
        parentTaskId: 't2',
        projectId: 'p1',
        title: 'Add smooth transitions',
        description: 'Implement animation for menu open/close',
        status: 'in-progress',
        priority: 'low',
        assigneeId: '3',
        creatorId: '3',
        startDate: new Date('2026-01-15'),
        dueDate: new Date('2026-01-20'),
        tags: ['animation'],
        estimatedHours: 6,
    },
    {
        id: 't2-3',
        parentTaskId: 't2',
        projectId: 'p1',
        title: 'Test on different devices',
        description: 'Cross-browser and device compatibility testing',
        status: 'open',
        priority: 'medium',
        assigneeId: '3',
        creatorId: '3',
        startDate: new Date('2026-01-20'),
        dueDate: new Date('2026-01-24'),
        tags: ['testing'],
        estimatedHours: 6,
    },
];

export function getTaskById(id: string): Task | undefined {
    return [...mockTasks, ...mockSubtasks].find((task) => task.id === id);
}

export function getTasksByProject(projectId: string): Task[] {
    return mockTasks.filter((task) => task.projectId === projectId);
}

export function getTasksByStatus(status: TaskStatus): Task[] {
    return mockTasks.filter((task) => task.status === status);
}

export function getTasksByAssignee(assigneeId: string): Task[] {
    return mockTasks.filter((task) => task.assigneeId === assigneeId);
}

export function getSubtasks(parentTaskId: string): Task[] {
    return mockSubtasks.filter((task) => task.parentTaskId === parentTaskId);
}

export function getOverdueTasks(): Task[] {
    const now = new Date();
    return mockTasks.filter(
        (task) => task.status !== 'completed' && task.dueDate < now
    );
}
