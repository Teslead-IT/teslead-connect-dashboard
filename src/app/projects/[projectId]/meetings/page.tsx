'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Loader } from '@/components/ui/Loader';

interface Meeting {
    id: string;
    meetingDate: string;
    location: string;
    purpose?: string;
    noOfPeople: number;
}

export default function MeetingsPage({ params }: { params: { projectId: string } }) {
    const router = useRouter();
    const { projectId } = params;
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMeetings();
    }, [projectId]);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/meetings`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setMeetings(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching meetings:', err);
            setError(err.response?.data?.message || 'Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (info: any) => {
        router.push(`/projects/${projectId}/meetings/new?date=${info.dateStr}`);
    };

    const handleEventClick = (info: any) => {
        router.push(`/projects/${projectId}/meetings/${info.event.id}`);
    };

    // Transform meetings into calendar events
    const events = meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.purpose || `Meeting at ${meeting.location}`,
        date: meeting.meetingDate.split('T')[0],
        backgroundColor: '#091590',
        borderColor: '#091590',
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meetings Calendar</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Click on a date to schedule a new meeting or click on an existing meeting to view details
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/projects/${projectId}/meetings/new?date=${new Date().toISOString().split('T')[0]}`)}
                    className="px-4 py-2 bg-[#091590] text-white rounded-lg hover:bg-[#0a1a7a] transition-colors font-medium"
                >
                    New Meeting
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    events={events}
                    height="auto"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek',
                    }}
                    buttonText={{
                        today: 'Today',
                        month: 'Month',
                        week: 'Week',
                    }}
                />
            </div>
        </div>
    );
}
