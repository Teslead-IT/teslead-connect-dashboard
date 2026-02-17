'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetings, useCreateMeetingDraft } from '@/hooks/use-meetings';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { MeetingsTable } from '@/components/meetings/MeetingsTable';
import { Dialog } from '@/components/ui/Dialog';
import { useProjects } from '@/hooks/use-projects';

export default function MeetingsPage() {
    const router = useRouter();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | undefined>();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedDateForDraft, setSelectedDateForDraft] = useState<string | undefined>();

    // Fetch meetings from backend
    const { data: meetings, isLoading } = useMeetings();
    const { mutateAsync: createDraft, isPending: isCreatingDraft } = useCreateMeetingDraft();
    const { data: projects } = useProjects();

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

        try {
            // Check if user has any projects
            if (!projects?.data || projects.data.length === 0) {
                alert('Please create a project first before creating a meeting.');
                setShowConfirmModal(false);
                setSelectedDateForDraft(undefined);
                return;
            }

            // Use first project from paginated response
            const defaultProjectId = projects.data[0].id;

            console.log('Creating meeting with:', {
                meetingDate: selectedDateForDraft,
                projectId: defaultProjectId,
            });

            const meeting = await createDraft({
                meetingDate: selectedDateForDraft,
                projectId: defaultProjectId,
            });

            console.log('Meeting created successfully:', meeting);

            // Redirect to edit page with real meeting ID
            router.push(`/meetings/${meeting.id}`);
        } catch (error: any) {
            console.error('Failed to create meeting:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
            });

            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create meeting. Please try again.';
            alert(errorMessage);
        } finally {
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
        <div className="flex flex-col h-[calc(100vh-100px)] bg-[#f8fafc] p-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#091590] to-[#2563eb] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/10">
                                <CalendarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    Meeting Scheduler
                                </h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                                    {view === 'calendar' ? 'Events & Availability' : 'Data Repository'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
                                <button
                                    onClick={() => setView('calendar')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-black transition-all duration-200",
                                        view === 'calendar'
                                            ? "bg-white text-[#091590] shadow-sm ring-1 ring-black/5"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    CALENDAR
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-black transition-all duration-200",
                                        view === 'list'
                                            ? "bg-white text-[#091590] shadow-sm ring-1 ring-black/5"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    LIST
                                </button>
                            </div>

                            {/* <button
                                onClick={handleNewMeeting}
                                className="inline-flex items-center gap-2 bg-[#091590] text-white hover:bg-[#071170] cursor-pointer active:scale-95 font-black px-6 h-11 text-xs rounded-xl transition-all shadow-md shadow-blue-900/20 border border-transparent"
                            >
                                <Plus className="w-4 h-4" />
                                NEW SESSION
                            </button> */}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-6 bg-white">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-[#091590]/10 rounded-full"></div>
                                    <div className="absolute top-0 w-16 h-16 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Initialising Schedule...</p>
                            </div>
                        </div>
                    ) : view === 'calendar' ? (
                        <div className="h-full bg-white rounded-xl p-2 custom-calendar">
                            <style jsx global>{`
                                .custom-calendar .fc {
                                    font-family: inherit;
                                    --fc-border-color: #f1f5f9;
                                    --fc-today-bg-color: #f8fafc;
                                    --fc-button-bg-color: transparent;
                                    --fc-button-border-color: #e2e8f0;
                                    --fc-button-hover-bg-color: #f8fafc;
                                    --fc-button-hover-border-color: #cbd5e1;
                                    --fc-button-active-bg-color: #f1f5f9;
                                    --fc-button-active-border-color: #cbd5e1;
                                    --fc-button-text-color: #475569;
                                    --fc-page-bg-color: #ffffff;
                                }
                                .custom-calendar .fc .fc-button-primary:not(:disabled).fc-button-active,
                                .custom-calendar .fc .fc-button-primary:not(:disabled):active {
                                    background-color: #091590;
                                    border-color: #091590;
                                    color: white;
                                }
                                .custom-calendar .fc-toolbar-title {
                                    font-size: 1.25rem !important;
                                    font-weight: 800 !important;
                                    color: #0f172a;
                                    letter-spacing: -0.025em;
                                }
                                .custom-calendar .fc-button {
                                    font-weight: 700 !important;
                                    font-size: 0.7rem !important;
                                    text-transform: uppercase !important;
                                    padding: 0.6rem 1rem !important;
                                    border-radius: 10px !important;
                                    transition: all 0.2s ease !important;
                                }
                                .custom-calendar .fc-daygrid-day-number {
                                    font-weight: 800;
                                    color: #94a3b8;
                                    font-size: 0.75rem;
                                    padding: 10px !important;
                                }
                                .custom-calendar .fc-col-header-cell-cushion {
                                    font-weight: 800;
                                    text-transform: uppercase;
                                    font-size: 0.65rem;
                                    letter-spacing: 0.1em;
                                    color: #64748b;
                                    padding: 12px 0 !important;
                                }
                                .custom-calendar .fc-day-today {
                                    background: #f8fafc !important;
                                }
                                .custom-calendar .fc-day-today .fc-daygrid-day-number {
                                    color: #091590;
                                    background: #eff6ff;
                                    border-radius: 0 0 0 10px;
                                }
                                .custom-calendar .fc-event {
                                    border-radius: 6px !important;
                                    border: none !important;
                                    padding: 2px 4px !important;
                                    margin: 2px !important;
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
                                    <div className="flex items-center gap-1.5 px-2 py-1 cursor-pointer bg-blue-50 text-[#091590] rounded-md border-l-4 border-[#091590] shadow-sm hover:bg-blue-100 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#091590] animate-pulse"></div>
                                        <span className="text-[10px] font-black truncate">{eventInfo.event.title}</span>
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

            {/* Confirmation Dialog */}
            <Dialog
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setSelectedDateForDraft(undefined);
                }}
                type="info"
                title="Initialize Session"
                message="Would you like to generate a new Minutes of Meeting for the selected date? This will create a fresh workspace for your discussion points."
                confirmText="Yes, Proceed"
                cancelText="Dismiss"
                onConfirm={handleConfirmCreate}
                isLoading={isCreatingDraft}
            />

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedDate(undefined);
                }}
                selectedDate={selectedDate}
            />
        </div>
    );
}
