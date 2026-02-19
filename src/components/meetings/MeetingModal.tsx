'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetings, useDeleteMeeting } from '@/hooks/use-meetings';
import { MeetingForm } from './MeetingForm';
import Dialog from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { Loader } from '@/components/ui/Loader';

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** The date to show meetings for */
    selectedDate: string;
    /** If set, open this specific meeting in the right panel */
    selectedMeetingId?: string | null;
    /** Start in create mode */
    createMode?: boolean;
    /** If set, highlight this project mention in the editor */
    highlightProjectId?: string;
}

export function MeetingModal({
    isOpen,
    onClose,
    selectedDate,
    selectedMeetingId = null,
    createMode = false,
    highlightProjectId,
}: MeetingModalProps) {
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(selectedMeetingId);
    const [isCreateMode, setIsCreateMode] = useState(createMode);
    const [createKey, setCreateKey] = useState(0);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { success, error: showError } = useToast();
    const { mutateAsync: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

    // Fetch meetings for the selected date
    const { data: meetingsData, isLoading, refetch } = useMeetings({
        fromDate: selectedDate,
        toDate: selectedDate,
        limit: 100,
    });

    const meetings = meetingsData?.data || [];

    // Sync props to state when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveMeetingId(selectedMeetingId);
            setIsCreateMode(createMode);
        }
    }, [isOpen, selectedMeetingId, createMode]);

    // Auto-select first meeting when loading edit mode and no specific meeting selected
    useEffect(() => {
        if (!isCreateMode && !activeMeetingId && meetings.length > 0 && !isLoading) {
            setActiveMeetingId(meetings[0].id);
        }
    }, [meetings, isCreateMode, activeMeetingId, isLoading]);

    if (!isOpen) return null;

    const handleCardClick = (meetingId: string) => {
        setIsCreateMode(false);
        setActiveMeetingId(meetingId);
    };

    const handleCreateNew = () => {
        setCreateKey(prev => prev + 1);
        setIsCreateMode(true);
        setActiveMeetingId(null);
    };

    const handleCreated = (newMeeting: any) => {
        refetch();
        setCreateKey(prev => prev + 1);
        setIsCreateMode(true);
        setActiveMeetingId(null);
    };

    const handleDeleted = () => {
        refetch();
        setActiveMeetingId(null);
        if (meetings.length <= 1) {
            setIsCreateMode(true);
        }
    };

    const handleSaved = () => {
        refetch();
    };

    const confirmDeleteCard = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteMeeting(deleteConfirmId);
            success('Meeting deleted');
            if (activeMeetingId === deleteConfirmId) {
                setActiveMeetingId(null);
            }
            setDeleteConfirmId(null);
            refetch();
        } catch (err) {
            showError('Delete Failed', 'Could not delete meeting.');
            setDeleteConfirmId(null);
        }
    };

    // Determine the display title for the modal header
    const getHeaderTitle = (): string => {
        if (isCreateMode) return 'New Meeting';
        if (activeMeetingId) {
            const activeMeeting = meetings.find((m: any) => m.id === activeMeetingId);
            return activeMeeting?.title || 'Untitled Meeting';
        }
        return 'Select a Meeting';
    };

    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <>
            {/* Backdrop — no click close */}
            <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />

            {/* Modal - full view with 20px gaps */}
            <div className="fixed z-[9999] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{ top: 20, left: 20, right: 20, bottom: 20 }}
            >
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#091590] to-[#2563eb] rounded-xl flex items-center justify-center shadow-md">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{getHeaderTitle()}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: Left Cards + Right Form */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Meeting Cards */}
                    <div className="w-[300px] border-r border-gray-100 bg-gray-50/50 flex flex-col flex-shrink-0">
                        {/* Create Button */}
                        <div className="p-3 border-b border-gray-100">
                            <button
                                onClick={handleCreateNew}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                    isCreateMode
                                        ? "bg-[#091590] text-white shadow-md"
                                        : "bg-white text-[#091590] border border-gray-200 hover:border-[#091590] hover:bg-blue-50"
                                )}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Meeting
                            </button>
                        </div>

                        {/* Cards List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader size={32} />
                                </div>
                            ) : meetings.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <Calendar className="w-10 h-10 text-gray-200 mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No meetings</p>
                                    <p className="text-[10px] text-gray-400 mt-1">for this date</p>
                                </div>
                            ) : (
                                meetings.map((meeting: any) => {
                                    const isActive = !isCreateMode && activeMeetingId === meeting.id;
                                    return (
                                        <div
                                            key={meeting.id}
                                            onClick={() => handleCardClick(meeting.id)}
                                            className={cn(
                                                "relative rounded-xl p-3 cursor-pointer transition-all group border",
                                                isActive
                                                    ? "bg-[#091590] text-white border-[#091590] shadow-lg shadow-blue-900/20"
                                                    : "bg-white text-gray-900 border-gray-100 hover:border-blue-200 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className={cn(
                                                        "font-bold text-sm truncate",
                                                        isActive ? "text-white" : "text-gray-900"
                                                    )}>
                                                        {meeting.title || 'Untitled'}
                                                    </h3>
                                                    <div className={cn(
                                                        "flex items-center gap-2 mt-1.5",
                                                        isActive ? "text-white/70" : "text-gray-400"
                                                    )}>
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                                            {meeting.time || 'No time set'}
                                                        </span>
                                                    </div>
                                                    {meeting.location && (
                                                        <p className={cn(
                                                            "text-[10px] font-medium mt-1 truncate",
                                                            isActive ? "text-white/60" : "text-gray-400"
                                                        )}>
                                                            📍 {meeting.location}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirmId(meeting.id);
                                                    }}
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                                        isActive
                                                            ? "hover:bg-white/20 text-white/60 hover:text-white"
                                                            : "opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500"
                                                    )}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Card count */}
                        {!isLoading && meetings.length > 0 && (
                            <div className="px-3 py-2 border-t border-gray-100 bg-white">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                    {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Form */}
                    <div className="flex-1 overflow-hidden">
                        {isCreateMode ? (
                            <MeetingForm
                                key={`create-new-${createKey}`}
                                meetingId={null}
                                defaultDate={selectedDate}
                                onCreated={handleCreated}
                                onDeleted={handleDeleted}
                                onSaved={handleSaved}
                            />
                        ) : activeMeetingId ? (
                            <MeetingForm
                                key={activeMeetingId}
                                meetingId={activeMeetingId}
                                defaultDate={selectedDate}
                                highlightProjectId={highlightProjectId}
                                onCreated={handleCreated}
                                onDeleted={handleDeleted}
                                onSaved={handleSaved}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select a meeting</p>
                                    <p className="text-[10px] text-gray-400 mt-1">or create a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Card Confirmation */}
            <Dialog
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                type="warning"
                title="Delete Meeting"
                message="Are you sure you want to permanently delete this meeting? This action cannot be undone."
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDeleteCard}
                isLoading={isDeleting}
            />
        </>
    );
}
