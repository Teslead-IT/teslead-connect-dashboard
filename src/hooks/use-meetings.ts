import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Meeting {
    id: string;
    orgId: string;
    projectId: string;
    meetingDate: Date | string;
    location?: string;
    purpose?: string;
    noOfPeople: number;
    attendedBy?: string;
    absentees?: string;
    description?: string;  // Rich text HTML content
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy?: string;
    project?: {
        id: string;
        name: string;
    };
    points?: MeetingPoint[];
}

export interface MeetingPoint {
    id?: string;
    sno: number;
    description: string;
    remark?: string;
}

export interface CreateMeetingRequest {
    projectId: string;
    meetingDate: string;
    location: string;
    purpose?: string;
    noOfPeople: number;
    attendedBy?: string;
    absentees?: string;
    points: MeetingPoint[];
}

// --- MOCK DATA STORE (Volatile) ---
const MOCK_MEETINGS: Meeting[] = [
    {
        id: 'mock-1',
        orgId: 'org-1',
        projectId: 'proj-1',
        meetingDate: new Date().toISOString(),
        location: 'Board Room A',
        purpose: 'Weekly Sync-up',
        noOfPeople: 5,
        attendedBy: 'John, Mike, Sarah',
        absentees: 'None',
        description: `
            <h1>Project Launch Strategy</h1>
            <p><strong>Goal:</strong> Define the roadmap for Q3 2026 deployment.</p>
            <hr />
            <h2>Action Items</h2>
            <ul>
                <li>Finalize UI specifications for the dashboard</li>
                <li>Conduct security audit of all API endpoints</li>
                <li>Prepare marketing collateral for the beta release</li>
            </ul>
            <hr />
            <blockquote>"Complexity is the enemy of execution. We must keep the interface clean and the logic robust."</blockquote>
            <p>Next steps: Sync with the design team on Wednesday.</p>
        `,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: { id: 'proj-1', name: 'Teslead Connect' }
    }
];

// Fetch all meetings (global view or project-specific)
export function useMeetings(projectId?: string) {
    return useQuery({
        queryKey: ['meetings', projectId],
        queryFn: async () => {
            console.log('MOCK: Fetching all meetings');
            return [...MOCK_MEETINGS];
        },
    });
}

// Create a new meeting
export function useCreateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateMeetingRequest) => {
            console.log('MOCK: Creating new meeting', data);
            const newMeeting: Meeting = {
                id: `mock-${Math.random().toString(36).substr(2, 9)}`,
                orgId: 'mock-org',
                projectId: data.projectId,
                meetingDate: data.meetingDate,
                location: data.location,
                purpose: data.purpose,
                noOfPeople: data.noOfPeople,
                attendedBy: data.attendedBy,
                absentees: data.absentees,
                description: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                project: { id: data.projectId, name: 'Sample Project' }
            };
            MOCK_MEETINGS.push(newMeeting);
            return newMeeting;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}

// Create a draft meeting (minimal data for calendar click)
export function useCreateMeetingDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { meetingDate: string; projectId: string }) => {
            console.log('MOCK: Initializing session for date:', data.meetingDate);

            const newMeeting: Meeting = {
                id: `mock-${Math.random().toString(36).substr(2, 9)}`,
                orgId: 'mock-org',
                projectId: data.projectId,
                meetingDate: data.meetingDate,
                location: '',
                purpose: 'Meeting on ' + data.meetingDate,
                noOfPeople: 0,
                attendedBy: '',
                absentees: '',
                description: '<h2>Objective</h2><p>Document session goals here...</p>',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                project: { id: data.projectId, name: 'Project ' + data.projectId }
            };

            MOCK_MEETINGS.push(newMeeting);

            // Artificial delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 800));

            return newMeeting;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}

// Get single meeting details
export function useMeeting(meetingId: string) {
    return useQuery({
        queryKey: ['meeting', meetingId],
        queryFn: async () => {
            console.log('MOCK: Fetching meeting detail for:', meetingId);
            const meeting = MOCK_MEETINGS.find(m => m.id === meetingId);
            if (!meeting) {
                // Return a generic mock if not found in volatile storage
                return {
                    id: meetingId,
                    orgId: 'mock-org',
                    projectId: 'mock-p',
                    meetingDate: new Date().toISOString(),
                    location: 'Showcase Room',
                    purpose: 'Premium UI Demonstration',
                    noOfPeople: 12,
                    attendedBy: 'UI Designer, Stakeholder, Developer',
                    absentees: 'None',
                    description: `
                        <h1>Global Expansion Session</h1>
                        <p>This is a <strong>Showcase Mode</strong> demonstration. Feel free to edit this content using the premium toolbar above.</p>
                        <hr />
                        <h3>Discussion Points</h3>
                        <ul>
                            <li>Expansion into European markets (Phase 1)</li>
                            <li>Integration with local payment gateways</li>
                            <li>Localization of the user interface for 12 languages</li>
                        </ul>
                        <p>Current Status: <span style="background-color: #fef08a; padding: 2px 4px; border-radius: 4px;">In Progress</span></p>
                    `,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    project: { id: 'mock-p', name: 'UI Prototype' }
                };
            }
            return meeting;
        },
        enabled: !!meetingId,
    });
}

// Update a meeting
export function useUpdateMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<CreateMeetingRequest> & { id: string }) => {
            console.log('MOCK: Syncing record:', id, data);

            const index = MOCK_MEETINGS.findIndex(m => m.id === id);
            if (index !== -1) {
                MOCK_MEETINGS[index] = { ...MOCK_MEETINGS[index], ...data };
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_MEETINGS[index] || { id, ...data };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
        },
    });
}

// Delete a meeting
export function useDeleteMeeting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            console.log('MOCK: Deleting record:', id);
            const index = MOCK_MEETINGS.findIndex(m => m.id === id);
            if (index !== -1) {
                MOCK_MEETINGS.splice(index, 1);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
        },
    });
}
