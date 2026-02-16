'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMeeting, useUpdateMeeting, useDeleteMeeting } from '@/hooks/use-meetings';
import { RichTextEditor } from '@/components/meetings/RichTextEditor';
import {
    Save,
    Trash2,
    Calendar,
    MapPin,
    Users,
    UserCheck,
    UserX,
    FileText,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MeetingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params?.id as string;

    const { data: meeting, isLoading } = useMeeting(meetingId);
    const { mutateAsync: updateMeeting, isPending: isSaving } = useUpdateMeeting();
    const { mutateAsync: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

    const [formData, setFormData] = useState({
        location: '',
        purpose: '',
        noOfPeople: 0,
        attendedBy: '',
        absentees: '',
        description: '',
    });

    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (meeting) {
            setFormData({
                location: meeting.location || '',
                purpose: meeting.purpose || '',
                noOfPeople: meeting.noOfPeople || 0,
                attendedBy: meeting.attendedBy || '',
                absentees: meeting.absentees || '',
                description: meeting.description || '',
            });
        }
    }, [meeting]);

    const handleSave = async () => {
        try {
            await updateMeeting({
                id: meetingId,
                ...formData,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save meeting:', error);
            alert('Failed to save meeting');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) return;

        try {
            await deleteMeeting(meetingId);
            router.push('/meetings');
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            alert('Failed to delete meeting');
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
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/meetings')}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Minutes of Meeting
                                </h1>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {meetingDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {saveSuccess && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-right duration-300">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm font-bold">Saved!</span>
                                </div>
                            )}
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-[#091590] text-white rounded-lg hover:bg-[#071170] font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metadata Form */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#091590]" />
                        Meeting Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Enter meeting location"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-transparent transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Number of People */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                Number of People
                            </label>
                            <input
                                type="number"
                                value={formData.noOfPeople}
                                onChange={(e) => setFormData({ ...formData, noOfPeople: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-transparent transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Purpose */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                Purpose of Meeting
                            </label>
                            <textarea
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                placeholder="Brief description of the meeting purpose"
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-transparent transition-all text-sm font-medium resize-none"
                            />
                        </div>

                        {/* Attended By */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-600" />
                                Attended By
                            </label>
                            <input
                                type="text"
                                value={formData.attendedBy}
                                onChange={(e) => setFormData({ ...formData, attendedBy: e.target.value })}
                                placeholder="e.g., John, Sarah, Mike"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-transparent transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Absentees */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <UserX className="w-4 h-4 text-red-600" />
                                Absentees
                            </label>
                            <input
                                type="text"
                                value={formData.absentees}
                                onChange={(e) => setFormData({ ...formData, absentees: e.target.value })}
                                placeholder="e.g., Jane, Tom"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-transparent transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Rich Text Editor */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Discussion & Description</h2>
                    <RichTextEditor
                        content={formData.description}
                        onChange={(html) => setFormData({ ...formData, description: html })}
                        placeholder="Enter detailed meeting notes, discussion points, action items, etc. Use the toolbar to format text and add tables."
                    />
                </div>
            </div>
        </div>
    );
}
