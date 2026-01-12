export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';

export interface Project {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    progress: number;
    ownerId: string;
    startDate: Date;
    endDate: Date;
    teamMembers: string[];
    tags: string[];
}

export const mockProjects: Project[] = [
    {
        id: 'p1',
        name: 'Website Development',
        description: 'Complete redesign of company website with modern UI/UX',
        status: 'active',
        progress: 65,
        ownerId: '1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        teamMembers: ['1', '2', '3'],
        tags: ['frontend', 'ui/ux', 'web'],
    },
    {
        id: 'p2',
        name: 'Mobile App Development',
        description: 'Native iOS and Android application for customer engagement',
        status: 'active',
        progress: 40,
        ownerId: '2',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2026-04-30'),
        teamMembers: ['2', '4', '5'],
        tags: ['mobile', 'ios', 'android'],
    },
    {
        id: 'p3',
        name: 'Backend API Refactor',
        description: 'Microservices architecture migration and API optimization',
        status: 'active',
        progress: 80,
        ownerId: '3',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-02-28'),
        teamMembers: ['3', '4'],
        tags: ['backend', 'api', 'microservices'],
    },
    {
        id: 'p4',
        name: 'Database Migration',
        description: 'Migrate from PostgreSQL to MongoDB for better scalability',
        status: 'on-hold',
        progress: 25,
        ownerId: '1',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-01-31'),
        teamMembers: ['1', '3'],
        tags: ['database', 'migration'],
    },
    {
        id: 'p5',
        name: 'Security Audit',
        description: 'Comprehensive security assessment and vulnerability fixes',
        status: 'completed',
        progress: 100,
        ownerId: '4',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-31'),
        teamMembers: ['4', '5'],
        tags: ['security', 'audit'],
    },
];

export function getProjectById(id: string): Project | undefined {
    return mockProjects.find((project) => project.id === id);
}

export function getProjectsByStatus(status: ProjectStatus): Project[] {
    return mockProjects.filter((project) => project.status === status);
}

export function getProjectsByOwner(ownerId: string): Project[] {
    return mockProjects.filter((project) => project.ownerId === ownerId);
}
