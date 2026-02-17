'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMeeting, useUpdateMeeting, useDeleteMeeting } from '@/hooks/use-meetings';
import { RichTextEditor } from '@/components/meetings/RichTextEditor';
import Dialog from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
    CheckCircle2,
    MessageSquare,
    X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function MeetingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params?.id as string;

    const { data: meeting, isLoading } = useMeeting(meetingId);
    const { mutateAsync: updateMeeting, isPending: isSaving } = useUpdateMeeting();
    const { mutateAsync: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

    const { success, error: showError } = useToast();

    const [formData, setFormData] = useState({
        location: '',
        purpose: '',
        noOfPeople: 0,
        attendedBy: '',
        absentees: '',
        description: '',
        meetingDate: '',
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isInitializedRef = React.useRef(false);
    const lastMeetingIdRef = React.useRef(meetingId);

    useEffect(() => {
        // Reset initialization if meeting ID changed
        if (meetingId !== lastMeetingIdRef.current) {
            isInitializedRef.current = false;
            lastMeetingIdRef.current = meetingId;
        }

        if (meeting && !isInitializedRef.current) {
            setFormData({
                location: meeting.location || '',
                purpose: meeting.purpose || '',
                noOfPeople: meeting.noOfPeople || 0,
                attendedBy: meeting.attendedBy || '',
                absentees: meeting.absentees || '',
                description: meeting.description || '',
                meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().split('T')[0] : '',
            });
            isInitializedRef.current = true;
        }
    }, [meeting, meetingId]);

    const handleSave = async () => {
        try {
            await updateMeeting({
                id: meetingId,
                ...formData,
            });
            success('Meeting saved successfully');
        } catch (error) {
            console.error('Failed to save meeting:', error);
            showError('Failed to Save', 'Something went wrong while updating the record.');
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
            alert('Failed to delete meeting');
            setShowDeleteModal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Not Found</h1>
                    <p className="text-gray-600 mb-4">This meeting doesn't exist or you don't have access to it.</p>
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

    const meetingDate = new Date(meeting.meetingDate);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Compact Combined Header (Matching Projects UI) */}
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
                                    <div className="px-2 py-0.5 bg-[#091590]/5 border border-[#091590]/10 rounded-md text-[#091590] font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
                                        Minutes of Meeting
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 flex-shrink-0 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {meetingDate.toLocaleDateString('en-US', {
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
                        {/* 
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-10 h-10 p-0 text-gray-400 hover:text-red-500 border border-gray-200 bg-white"
                            title="Delete Meeting"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        */}
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
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Record</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50/30 py-2 px-2 sm:px-4">
                <div className="w-full space-y-4 pb-8">
                    {/* Integrated Metadata Canvas (Free UI) */}
                    <div className="space-y-4">
                        {/* Row 1: Quick Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* location */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <MapPin className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Physical or Digital Link"
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm"
                                />
                            </div>

                            {/* Number of peoples */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <Users className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Number of peoples
                                </label>
                                <input
                                    type="number"
                                    value={formData.noOfPeople}
                                    onChange={(e) => setFormData({ ...formData, noOfPeople: parseInt(e.target.value) || 0 })}
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
                                    value={formData.meetingDate.includes('T') ? formData.meetingDate.split('T')[1].substring(0, 5) : formData.meetingDate}
                                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                                    className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#091590] transition-colors text-sm font-medium text-gray-900 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Row 2: Detailed Info (Textareas) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Purpose of meeting */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <FileText className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                                    Purpose of meeting
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

                            {/* Absenties */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserX className="w-3 h-3 text-red-500 inline-block mr-1.5 -mt-0.5" />
                                    Absenties
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

                    {/* Rich Text Editor Section (Container removed per user request) */}
                    <div className="pt-2 space-y-1">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">
                            <MessageSquare className="w-3 h-3 text-[#091590] inline-block mr-1.5 -mt-0.5" />
                            Discussion area
                        </label>
                        <RichTextEditor
                            content={formData.description}
                            onChange={(html) => setFormData({ ...formData, description: html })}
                            placeholder="Document action items, decisions, and key insights..."
                        />
                    </div>

                    {/* Stats Preview Card (Commented out per user request) */}
                    {/* 
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Users className="w-5 h-5 text-[#091590]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{formData.noOfPeople}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Participants</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{formData.description.length}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Characters</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-green-600">READY</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    */}
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
