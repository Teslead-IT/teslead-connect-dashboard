'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMeeting, useUpdateMeeting, useDeleteMeeting, usePublishMeeting, useCreateMeeting } from '@/hooks/use-meetings';
import { RichTextEditor } from '@/components/meetings/RichTextEditor';
import Dialog from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
    Save,
    Trash2,
    Calendar,
    Clock,
    MapPin,
    Users,
    UserCheck,
    UserX,
    FileText,
    ArrowLeft,
    Send,
    MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';


export default function MeetingDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const meetingId = params?.id as string;
    const isNew = meetingId === 'new';
    const dateParam = searchParams.get('date');

    // Only fetch if it's an existing meeting
    const { data: meeting, isLoading } = useMeeting(isNew ? '' : meetingId);

    // Mutations
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
        meetingDate: '',
        time: '',
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [highlightProjectId, setHighlightProjectId] = useState<string | null>(null);

    useEffect(() => {
        const highlight = searchParams.get('highlight');
        const projectId = searchParams.get('projectId');

        if (highlight === 'true') {
            setIsHighlighted(true);
            if (projectId) setHighlightProjectId(projectId);

            const timer = setTimeout(() => {
                setIsHighlighted(false);
                setHighlightProjectId(null);
                // Clean up URL without refreshing
                const newParams = new URLSearchParams(window.location.search);
                newParams.delete('highlight');
                newParams.delete('projectId');
                const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
                window.history.replaceState({}, '', newUrl);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const isInitializedRef = useRef(false);
    const lastMeetingIdRef = useRef(meetingId);

    // Effect for initializing form data
    useEffect(() => {
        // Reset when ID changes (e.g. from 'new' to actual ID or vice versa)
        if (meetingId !== lastMeetingIdRef.current) {
            isInitializedRef.current = false;
            lastMeetingIdRef.current = meetingId;
            // If switching to new, reset form
            if (meetingId === 'new') {
                setFormData({
                    title: '',
                    location: '',
                    purpose: '',
                    numberOfPeople: 0,
                    attendedBy: '',
                    absentees: '',
                    content: null,
                    meetingDate: dateParam || '',
                    time: '',
                });
            }
        }

        // Initialize for New Meeting with Date Param
        if (isNew && !isInitializedRef.current && dateParam) {
            setFormData(prev => ({ ...prev, meetingDate: dateParam }));
            isInitializedRef.current = true;
        }

        // Initialize for Existing Meeting
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
    }, [meeting, meetingId, isNew, dateParam]);

    const handleSave = async () => {
        if (!formData.title.trim()) {
            showError('Validation Error', 'Please enter a meeting title');
            return;
        }

        try {
            if (isNew) {
                // Create
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
                    // status: 'PUBLISHED',
                });
                success('Meeting created successfully');
                router.replace(`/meetings/${newMeeting.id}`);
            } else {
                // Update
                await updateMeeting({
                    id: meetingId,
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
            }
        } catch (error) {
            console.error('Failed to save meeting:', error);
            showError('Failed to Save', 'Something went wrong while saving the record.');
        }
    };

    const handlePublish = async () => {
        if (isNew) return; // Cannot publish new meeting without saving first
        try {
            await publishMeeting(meetingId);
            success('Meeting published successfully');
        } catch (error) {
            console.error('Failed to publish meeting:', error);
            showError('Failed to Publish', 'Something went wrong while publishing.');
        }
    };

    const handleDelete = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteMeeting(meetingId);
            router.push('/meetings');
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            showError('Failed to Delete', 'Something went wrong while deleting the record.');
            setShowDeleteModal(false);
        }
    };

    // Loading state for fetching existing meeting
    if (isLoading && !isNew) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Loading meeting...</p>
                </div>
            </div>
        );
    }

    // Not found state
    if (!meeting && !isNew) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Not Found</h1>
                    <p className="text-gray-600 mb-4">This meeting doesn&apos;t exist or you don&apos;t have access to it.</p>
                    <button
                        onClick={() => router.push('/meetings')}
                        className="px-4 py-2 bg-[#091590] text-white rounded-lg hover:bg-[#071170] font-bold text-sm"
                    >
                        Back to Meetings
                    </button>
                </div>
            </div>
        );
    }

    const meetingDateObj = formData.meetingDate ? new Date(formData.meetingDate) : new Date();
    const isDraft = isNew || meeting?.status === 'DRAFT';

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-1.5 flex-shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => router.push('/meetings')}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 bg-[#091590]"
                            >
                                M
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Meeting Title"
                                        className="text-sm font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-gray-400 flex-1 min-w-[120px]"
                                    />
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {isDraft && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                DRAFT
                                            </span>
                                        )}
                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 flex-shrink-0 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {meetingDateObj.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isNew && isDraft && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePublish}
                                disabled={isPublishing || isSaving}
                                className="h-8 px-3 font-bold text-[11px] uppercase tracking-wider text-green-600 border border-green-200 hover:bg-green-50"
                            >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                {isPublishing ? 'Publishing...' : 'Publish'}
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-8 px-4 font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{isNew ? 'Creating Meeting...' : 'Saving...'}</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isNew ? 'Create Meeting' : 'Save Record'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50/30 py-2 px-2 sm:px-4">
                <div className="w-full space-y-4 pb-8">
                    {/* Metadata Fields */}
                    <div className="space-y-4">
                        {/* Row 1: Quick Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Location */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <MapPin className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Physical or Digital Link"
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Number of People */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <Users className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Number of People
                                </label>
                                <input
                                    type="number"
                                    value={formData.numberOfPeople}
                                    onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    min="0"
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 shadow-sm"
                                />
                            </div>

                            {/* Time */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <Clock className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.time || new Date().toISOString().split('T')[1]}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Row 2: Detailed Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Purpose */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <FileText className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Purpose of Meeting
                                </label>
                                <textarea
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    placeholder="Objective of the session..."
                                    rows={3}
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm resize-none"
                                />
                            </div>

                            {/* Attended By */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserCheck className="w-3 h-3 text-green-500 inline-block mr-1.5 -mt-0.5" />
                                    Attended By
                                </label>
                                <textarea
                                    value={formData.attendedBy}
                                    onChange={(e) => setFormData({ ...formData, attendedBy: e.target.value })}
                                    placeholder="John, Sarah..."
                                    rows={3}
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm resize-none"
                                />
                            </div>

                            {/* Absentees */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserX className="w-3 h-3 text-red-500 inline-block mr-1.5 -mt-0.5" />
                                    Absentees
                                </label>
                                <textarea
                                    value={formData.absentees}
                                    onChange={(e) => setFormData({ ...formData, absentees: e.target.value })}
                                    placeholder="None"
                                    rows={3}
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rich Text Editor Section */}
                    <div className={cn(
                        "pt-2 space-y-1 transition-all duration-700 rounded-xl p-1",
                        isHighlighted ? "ring-4 ring-[#091590] bg-blue-50/30 shadow-2xl shadow-blue-900/10 scale-[1.01]" : ""
                    )}>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                            <MessageSquare className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                            Discussion Area
                        </label>
                        <RichTextEditor
                            content={formData.content}
                            onChange={(json) => setFormData({ ...formData, content: json })}
                            placeholder="Document action items, decisions, and key insights... Use @ to mention users and # to mention projects"
                            highlightId={highlightProjectId || undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
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
