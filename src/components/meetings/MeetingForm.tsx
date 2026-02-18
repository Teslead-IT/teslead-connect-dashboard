'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMeeting, useUpdateMeeting, useDeleteMeeting, usePublishMeeting, useCreateMeeting } from '@/hooks/use-meetings';
import { RichTextEditor } from '@/components/meetings/RichTextEditor';
import Dialog from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
    Save,
    Trash2,
    Calendar,
    MapPin,
    Users,
    UserCheck,
    UserX,
    FileText,
    Send,
    MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface MeetingFormProps {
    meetingId: string | null; // null = create mode
    defaultDate?: string;
    highlightProjectId?: string;
    onCreated?: (newMeeting: any) => void;
    onDeleted?: () => void;
    onSaved?: () => void;
}

/**
 * Returns the current local time as HH:mm string
 */
function getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function MeetingForm({
    meetingId,
    defaultDate,
    highlightProjectId,
    onCreated,
    onDeleted,
    onSaved,
}: MeetingFormProps) {
    const isNew = !meetingId;

    const { data: meeting, isLoading } = useMeeting(meetingId || '');

    const { mutateAsync: createMeeting, isPending: isCreating } = useCreateMeeting();
    const { mutateAsync: updateMeeting, isPending: isUpdating } = useUpdateMeeting();
    const { mutateAsync: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();
    const { mutateAsync: publishMeeting, isPending: isPublishing } = usePublishMeeting();

    const isSaving = isCreating || isUpdating;
    const { success, error: showError } = useToast();

    const [formData, setFormData] = useState<{
        title: string;
        location: string;
        purpose: string;
        numberOfPeople: number;
        attendedBy: string;
        absentees: string;
        content: any;
        meetingDate: string;
        time: string;
    }>({
        title: '',
        location: '',
        purpose: '',
        numberOfPeople: 0,
        attendedBy: '',
        absentees: '',
        content: null,
        meetingDate: defaultDate || '',
        time: isNew ? getCurrentTime() : '',
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isInitializedRef = useRef(false);
    const lastMeetingIdRef = useRef(meetingId);

    useEffect(() => {
        if (meetingId !== lastMeetingIdRef.current) {
            isInitializedRef.current = false;
            lastMeetingIdRef.current = meetingId;
            if (!meetingId) {
                setFormData({
                    title: '',
                    location: '',
                    purpose: '',
                    numberOfPeople: 0,
                    attendedBy: '',
                    absentees: '',
                    content: null,
                    meetingDate: defaultDate || '',
                    time: getCurrentTime(),
                });
            }
        }

        if (isNew && !isInitializedRef.current && defaultDate) {
            setFormData(prev => ({ ...prev, meetingDate: defaultDate, time: prev.time || getCurrentTime() }));
            isInitializedRef.current = true;
        }

        if (!isNew && meeting && !isInitializedRef.current) {
            setFormData({
                title: meeting.title || '',
                location: meeting.location || '',
                purpose: meeting.purpose || '',
                numberOfPeople: meeting.numberOfPeople || 0,
                attendedBy: meeting.attendedBy || '',
                absentees: meeting.absentees || '',
                content: meeting.content || null,
                meetingDate: meeting.meetingDate
                    ? new Date(meeting.meetingDate).toISOString().split('T')[0]
                    : '',
                time: meeting.time || '',
            });
            isInitializedRef.current = true;
        }
    }, [meeting, meetingId, isNew, defaultDate]);

    const handleSave = async () => {
        if (!formData.title.trim()) {
            showError('Validation Error', 'Please enter a meeting title');
            return;
        }

        try {
            if (isNew) {
                const newMeeting = await createMeeting({
                    title: formData.title,
                    meetingDate: formData.meetingDate || new Date().toISOString().split('T')[0],
                    content: formData.content,
                    location: formData.location || undefined,
                    purpose: formData.purpose || undefined,
                    numberOfPeople: formData.numberOfPeople || undefined,
                    attendedBy: formData.attendedBy || undefined,
                    absentees: formData.absentees || undefined,
                    time: formData.time || undefined,
                });
                success('Meeting created successfully');
                onCreated?.(newMeeting);
            } else {
                await updateMeeting({
                    id: meetingId!,
                    title: formData.title,
                    content: formData.content,
                    location: formData.location,
                    purpose: formData.purpose,
                    numberOfPeople: formData.numberOfPeople,
                    attendedBy: formData.attendedBy,
                    absentees: formData.absentees,
                    meetingDate: formData.meetingDate,
                    time: formData.time,
                });
                success('Meeting saved successfully');
                onSaved?.();
            }
        } catch (error) {
            console.error('Failed to save meeting:', error);
            showError('Failed to Save', 'Something went wrong while saving the record.');
        }
    };

    const handlePublish = async () => {
        if (isNew || !meetingId) return;
        try {
            await publishMeeting(meetingId);
            success('Meeting published successfully');
        } catch (error) {
            console.error('Failed to publish meeting:', error);
            showError('Failed to Publish', 'Something went wrong while publishing.');
        }
    };

    const confirmDelete = async () => {
        if (!meetingId) return;
        try {
            await deleteMeeting(meetingId);
            setShowDeleteModal(false);
            onDeleted?.();
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            showError('Failed to Delete', 'Something went wrong while deleting the record.');
            setShowDeleteModal(false);
        }
    };

    if (isLoading && !isNew) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading...</p>
                </div>
            </div>
        );
    }

    if (!meeting && !isNew) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">Meeting not found</p>
            </div>
        );
    }

    const isDraft = !isNew && meeting?.status === 'DRAFT';

    return (
        <div className="h-full flex flex-col">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-[#091590] flex-shrink-0">
                        M
                    </div>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter The Meeting Title (Required)"
                        className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-gray-400 flex-1 min-w-[120px]"
                    />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isDraft && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePublish}
                            disabled={isPublishing || isSaving}
                            className="h-7 px-2.5 font-bold text-[10px] uppercase tracking-wider text-green-600 border border-green-200 hover:bg-green-50"
                        >
                            <Send className="w-3 h-3 mr-1" />
                            {isPublishing ? '...' : 'Publish'}
                        </Button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-1 h-7 px-3 bg-[#091590] text-white hover:bg-[#071170] active:scale-[0.98] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>{isNew ? 'Creating...' : 'Saving...'}</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3 h-3" />
                                <span>{isNew ? 'Create' : 'Update'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-auto bg-gray-50/30 py-2 px-3">
                <div className="w-full space-y-3 pb-6">
                    {/* Metadata Fields */}
                    <div className="space-y-3">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <MapPin className="w-3 h-3 text-[#091590] inline-block mr-1 -mt-0.5" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Physical or Digital Link"
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <Calendar className="w-3 h-3 text-[#091590] inline-block mr-1 -mt-0.5" />
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.meetingDate && formData.time ? `${formData.meetingDate}T${formData.time}` : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            const [date, time] = val.split('T');
                                            setFormData({ ...formData, meetingDate: date, time: time });
                                        }
                                    }}
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <Users className="w-3 h-3 text-[#091590] inline-block mr-1 -mt-0.5" />
                                    People
                                </label>
                                <input
                                    type="number"
                                    value={formData.numberOfPeople}
                                    onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <FileText className="w-3 h-3 text-[#091590] inline-block mr-1 -mt-0.5" />
                                    Purpose
                                </label>
                                <textarea
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    placeholder="Objective of the session..."
                                    rows={2}
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserCheck className="w-3 h-3 text-green-500 inline-block mr-1 -mt-0.5" />
                                    Attended By
                                </label>
                                <textarea
                                    value={formData.attendedBy}
                                    onChange={(e) => setFormData({ ...formData, attendedBy: e.target.value })}
                                    placeholder="John, Sarah..."
                                    rows={2}
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserX className="w-3 h-3 text-red-500 inline-block mr-1 -mt-0.5" />
                                    Absentees
                                </label>
                                <textarea
                                    value={formData.absentees}
                                    onChange={(e) => setFormData({ ...formData, absentees: e.target.value })}
                                    placeholder="None"
                                    rows={2}
                                    className="w-full bg-white px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                                />
                            </div>
                        </div>


                    </div>

                    {/* Rich Text Editor */}
                    <div className="pt-1 space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                            <MessageSquare className="w-3 h-3 text-[#091590] inline-block mr-1 -mt-0.5" />
                            Discussion Area
                        </label>
                        <RichTextEditor
                            content={formData.content}
                            onChange={(json) => setFormData({ ...formData, content: json })}
                            placeholder="Document action items, decisions, and key insights... Use @ to mention users and # to mention projects"
                            highlightId={highlightProjectId}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Dialog
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                type="warning"
                title="Delete Record"
                message="Are you sure you want to permanently delete this meeting record? This action cannot be undone."
                confirmText="Delete Record"
                confirmVariant="destructive"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}
