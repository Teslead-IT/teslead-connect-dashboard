'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetings } from '@/hooks/use-meetings';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { MeetingsTable } from '@/components/meetings/MeetingsTable';
import { ConfirmationModal } from '@/components/meetings/ConfirmationModal';

export default function MeetingsPage() {
    const router = useRouter();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | undefined>();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedDateForDraft, setSelectedDateForDraft] = useState<string | undefined>();
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);

    // Fetch meetings from backend
    const { data: meetings, isLoading } = useMeetings();

    // Transform meetings to FullCalendar events
    const calendarEvents = meetings?.map((meeting) => ({
        id: meeting.id,
        title: meeting.project?.name || 'Meeting',
        start: meeting.meetingDate,
        backgroundColor: '#091590',
        borderColor: '#091590',
        extendedProps: {
            location: meeting.location,
            purpose: meeting.purpose,
        },
    })) || [];

    const handleDateClick = (info: any) => {
        setSelectedDateForDraft(info.dateStr);
        setShowConfirmModal(true);
    };

    const handleConfirmCreate = async () => {
        if (!selectedDateForDraft) return;

        setIsCreatingDraft(true);
        try {
            // For now, just redirect to a mock ID (will be real after backend integration)
            const mockId = `draft_${Date.now()}`;
            router.push(`/meetings/${mockId}`);
        } catch (error) {
            console.error('Failed to create meeting:', error);
            alert('Failed to create meeting');
        } finally {
            setIsCreatingDraft(false);
            setShowConfirmModal(false);
            setSelectedDateForDraft(undefined);
        }
    };

    const handleEventClick = (info: any) => {
        const meetingId = info.event.id;
        router.push(`/meetings/${meetingId}`);
    };

    const handleNewMeeting = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setIsCreateModalOpen(true);
    };


    return (
        <>
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#091590] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <CalendarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                    Meetings
                                </h1>
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">
                                    {view === 'calendar' ? 'Calendar View' : 'All Meetings Table'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setView('calendar')}
                                    className={cn(
                                        "px-3 py-1 rounded text-xs font-bold transition-all",
                                        view === 'calendar'
                                            ? "bg-white text-[#091590] shadow-sm"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Calendar
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className={cn(
                                        "px-3 py-1 rounded text-xs font-bold transition-all",
                                        view === 'list'
                                            ? "bg-white text-[#091590] shadow-sm"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Table
                                </button>
                            </div>

                            <button
                                onClick={handleNewMeeting}
                                className="inline-flex items-center gap-1.5 bg-[#091590] text-white hover:bg-[#071170] cursor-pointer active:scale-95 font-bold px-4 h-9 text-xs rounded-lg transition-all shadow-sm border border-transparent"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Meeting
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-medium text-gray-500">Loading meetings...</p>
                            </div>
                        </div>
                    ) : view === 'calendar' ? (
                        <div className="h-full bg-white rounded-lg p-2 custom-calendar">
                            <style jsx global>{`
                                .custom-calendar .fc {
                                    font-family: inherit;
                                    --fc-border-color: #f1f5f9;
                                    --fc-today-bg-color: #f8fafc;
                                    --fc-button-bg-color: #091590;
                                    --fc-button-border-color: #091590;
                                    --fc-button-hover-bg-color: #071170;
                                    --fc-button-hover-border-color: #071170;
                                    --fc-button-active-bg-color: #050d55;
                                    --fc-page-bg-color: #ffffff;
                                }
                                .custom-calendar .fc-toolbar-title {
                                    font-size: 1.1rem !important;
                                    font-weight: 800 !important;
                                    color: #0f172a;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                }
                                .custom-calendar .fc-button {
                                    font-weight: 700 !important;
                                    font-size: 0.75rem !important;
                                    text-transform: uppercase !important;
                                    padding: 0.5rem 0.75rem !important;
                                    border-radius: 6px !important;
                                }
                                .custom-calendar .fc-daygrid-day-number {
                                    font-weight: 700;
                                    color: #64748b;
                                    font-size: 0.8rem;
                                }
                            `}</style>
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={calendarEvents}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek',
                                }}
                                height="100%"
                                eventContent={(eventInfo) => (
                                    <div className="p-1 text-[10px] font-bold cursor-pointer bg-[#091590] text-white rounded shadow-sm truncate">
                                        {eventInfo.event.title}
                                    </div>
                                )}
                            />
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto">
                            <MeetingsTable />
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <ConfirmationModal
                    title="Create MOM"
                    message="Are you sure you want to create a new Minutes of Meeting?"
                    onConfirm={handleConfirmCreate}
                    onCancel={() => {
                        setShowConfirmModal(false);
                        setSelectedDateForDraft(undefined);
                    }}
                    isLoading={isCreatingDraft}
                />
            )}

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedDate(undefined);
                }}
                selectedDate={selectedDate}
            />
        </>
    );
}
