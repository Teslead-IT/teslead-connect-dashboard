export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'member' | 'viewer';
}

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Sathish Kumar',
        email: 'sathish.kumar@example.com',
        role: 'admin',
    },
    {
        id: '2',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        role: 'member',
    },
    {
        id: '3',
        name: 'Raj Patel',
        email: 'raj.patel@example.com',
        role: 'member',
    },
    {
        id: '4',
        name: 'Anita Desai',
        email: 'anita.desai@example.com',
        role: 'member',
    },
    {
        id: '5',
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        role: 'viewer',
    },
];

export function getUserById(id: string): User | undefined {
    return mockUsers.find((user) => user.id === id);
}

export function getUserByEmail(email: string): User | undefined {
    return mockUsers.find((user) => user.email === email);
}
