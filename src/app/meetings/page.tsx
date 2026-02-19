'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, List as ListIcon, LayoutGrid, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetings } from '@/hooks/use-meetings';

import { MeetingsTable } from '@/components/meetings/MeetingsTable';
import { MeetingModal } from '@/components/meetings/MeetingModal';
import { Loader } from '@/components/ui/Loader';


export default function MeetingsPage() {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState('');
    const [modalMeetingId, setModalMeetingId] = useState<string | null>(null);
    const [modalCreateMode, setModalCreateMode] = useState(false);

    // Fetch meetings from backend
    const { data: meetingsData, isLoading, refetch } = useMeetings({ limit: 1000 });

    const meetings = meetingsData?.data || [];

    // Transform meetings to FullCalendar events
    const calendarEvents = meetings.map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title || meeting.project?.name || 'Meeting',
        start: meeting.meetingDate,
        backgroundColor: '#091590',
        borderColor: '#091590',
        extendedProps: {
            location: meeting.location,
            purpose: meeting.purpose,
        },
    }));

    // Click on a calendar event → open modal in view mode for that meeting's date
    const handleEventClick = (info: any) => {
        const meetingId = info.event.id;
        const eventDate = info.event.startStr?.split('T')[0] || new Date().toISOString().split('T')[0];
        setModalDate(eventDate);
        setModalMeetingId(meetingId);
        setModalCreateMode(false);
        setModalOpen(true);
    };

    // Click "Create Meeting" button → open modal in create mode for today
    const handleCreateMeeting = () => {
        const today = new Date().toISOString().split('T')[0];
        setModalDate(today);
        setModalMeetingId(null);
        setModalCreateMode(true);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setModalMeetingId(null);
        setModalCreateMode(false);
        refetch();
    };

    /**
     * Change redirection: clicking "more" opens the modal for that day directly.
     * Returning 'none' prevents the default popover from showing.
     * We keep this commented-out note as requested: // Default behavior was a popover.
     */
    const handleMoreLinkClick = (info: any) => {
        const eventDate = info.date.toISOString().split('T')[0];
        setModalDate(eventDate);
        setModalMeetingId(null);
        setModalCreateMode(false);
        setModalOpen(true);

        // To revert to the popup behavior in the future, uncomment the line below and comment out 'return none'
        // return 'popover';
        return 'none';
    };


    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header — matching Projects page style */}
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Meetings</h1>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                            {meetings.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                            <div className="flex items-center bg-gray-50 p-0.5 rounded-md border border-gray-200">
                                <button
                                    onClick={() => setView('calendar')}
                                    className={cn(
                                        'p-1 rounded transition-all',
                                        view === 'calendar'
                                            ? 'bg-white text-[var(--primary)] shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                    )}
                                    title="Calendar View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    disabled={true} // Temporarily disabled
                                    className={cn(
                                        'p-1 rounded transition-all opacity-50 cursor-not-allowed', // Added disabled styles
                                        view === 'list'
                                            ? 'bg-white text-[var(--primary)] shadow-sm'
                                            : 'text-gray-400'
                                    )}
                                    title="List View (Coming Soon)"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleCreateMeeting}
                                className="inline-flex items-center justify-center bg-[var(--primary)] text-white hover:bg-[#071170] hover:text-white active:scale-[0.98] font-medium px-4 h-8 text-xs rounded-md ml-1 sm:ml-2 transition-colors duration-200 border border-transparent shadow-sm whitespace-nowrap"
                            >
                                <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">New Meeting</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader />
                    </div>
                ) : view === 'calendar' ? (
                    <div className="h-full w-full bg-white p-4 custom-calendar" style={{ minHeight: 0 }}>
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
                            .custom-calendar .fc-daygrid-more-link {
                                font-size: 0.65rem !important;
                                font-weight: 800 !important;
                                color: #9d7553ff !important;
                                text-transform: uppercase !important;
                                letter-spacing: 0.05em;
                                padding: 2px 6px !important;
                                border-radius: 6px !important;
                                background: #eef2ff !important;
                                margin: 2px !important;
                            }
                        `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            moreLinkClick={handleMoreLinkClick}
                            headerToolbar={{
                                left: 'prev,next', // today
                                center: 'title',
                                right: '', // dayGridMonth
                            }}
                            dayMaxEvents={3}
                            moreLinkContent={(args: any) => `+${args.num}  more [View All]`}
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

            {/* Meeting Modal */}
            <MeetingModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                selectedDate={modalDate}
                selectedMeetingId={modalMeetingId}
                createMode={modalCreateMode}
            />
        </div>
    );
}
