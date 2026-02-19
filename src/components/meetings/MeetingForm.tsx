'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMeeting, useUpdateMeeting, useDeleteMeeting, usePublishMeeting, useCreateMeeting } from '@/hooks/use-meetings';
import { RichTextEditor } from '@/components/meetings/RichTextEditor';
import Dialog from '@/components/ui/Dialog';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
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
    X,
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

    const [attendedByInput, setAttendedByInput] = useState('');
    const [absenteesInput, setAbsenteesInput] = useState('');
    const [attendedByShowAll, setAttendedByShowAll] = useState(false);
    const [absenteesShowAll, setAbsenteesShowAll] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isInitializedRef = useRef(false);
    const lastMeetingIdRef = useRef(meetingId);

    useEffect(() => {
        if (meetingId !== lastMeetingIdRef.current) {
            isInitializedRef.current = false;
            lastMeetingIdRef.current = meetingId;
            setAttendedByShowAll(false);
            setAbsenteesShowAll(false);
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
                <Loader size={48} />
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
                            <div className="relative space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserCheck className="w-3 h-3 text-green-500 inline-block mr-1 -mt-0.5" />
                                    Attended By
                                </label>
                                <div className="min-h-[60px] w-full bg-white px-2 py-2 border border-gray-200 rounded-lg focus-within:border-[#091590] transition-colors flex flex-wrap gap-2 items-start">
                                    {formData.attendedBy.split(',').filter(name => name.trim()).slice(0, 5).map((name, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100 shadow-sm"
                                        >
                                            {name.trim()}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const names = formData.attendedBy.split(',').filter(n => n.trim());
                                                    names.splice(idx, 1);
                                                    setFormData({ ...formData, attendedBy: names.join(', ') });
                                                }}
                                                className="hover:bg-green-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.attendedBy.split(',').filter(name => name.trim()).length > 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setAttendedByShowAll(!attendedByShowAll)}
                                            className="text-[10px] font-bold text-[#091590] hover:underline self-center py-1 px-1"
                                        >
                                            + {formData.attendedBy.split(',').filter(name => name.trim()).length - 5} more [View more]
                                        </button>
                                    )}
                                    <input
                                        type="text"
                                        placeholder={formData.attendedBy ? "" : "John, Sarah..."}
                                        value={attendedByInput || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.includes(',')) {
                                                const newNames = val.split(',').map(n => n.trim()).filter(n => n);
                                                const existing = formData.attendedBy.split(',').map(n => n.trim()).filter(n => n);
                                                setFormData({ ...formData, attendedBy: [...existing, ...newNames].join(', ') });
                                                setAttendedByInput('');
                                            } else {
                                                setAttendedByInput(val);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && attendedByInput.trim()) {
                                                e.preventDefault();
                                                const existing = formData.attendedBy.split(',').map(n => n.trim()).filter(n => n);
                                                setFormData({ ...formData, attendedBy: [...existing, attendedByInput.trim()].join(', ') });
                                                setAttendedByInput('');
                                            } else if (e.key === 'Backspace' && !attendedByInput && formData.attendedBy) {
                                                const names = formData.attendedBy.split(',').map(n => n.trim()).filter(n => n);
                                                names.pop();
                                                setFormData({ ...formData, attendedBy: names.join(', ') });
                                            }
                                        }}
                                        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 py-0.5"
                                    />
                                </div>

                                {/* Localized Popup for Attended By */}
                                {attendedByShowAll && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setAttendedByShowAll(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl z-[70] p-4 animate-in fade-in zoom-in duration-200 origin-top">
                                            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Attended By</h3>
                                                <button onClick={() => setAttendedByShowAll(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                <ol className="list-decimal pl-5 space-y-1.5">
                                                    {formData.attendedBy.split(',').filter(name => name.trim()).map((name, idx) => (
                                                        <li key={idx} className="text-sm font-medium text-gray-700 group flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                            <span className="flex-1 truncate">{name.trim()}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const names = formData.attendedBy.split(',').filter(n => n.trim());
                                                                    names.splice(idx, 1);
                                                                    const newVal = names.join(', ');
                                                                    setFormData({ ...formData, attendedBy: newVal });
                                                                    if (names.length <= 5) setAttendedByShowAll(false);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative space-y-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                    <UserX className="w-3 h-3 text-red-500 inline-block mr-1 -mt-0.5" />
                                    Absentees
                                </label>
                                <div className="min-h-[60px] w-full bg-white px-2 py-2 border border-gray-200 rounded-lg focus-within:border-[#091590] transition-colors flex flex-wrap gap-2 items-start">
                                    {formData.absentees.split(',').filter(name => name.trim()).slice(0, 5).map((name, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold border border-red-100 shadow-sm"
                                        >
                                            {name.trim()}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const names = formData.absentees.split(',').filter(n => n.trim());
                                                    names.splice(idx, 1);
                                                    setFormData({ ...formData, absentees: names.join(', ') });
                                                }}
                                                className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.absentees.split(',').filter(name => name.trim()).length > 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setAbsenteesShowAll(!absenteesShowAll)}
                                            className="text-[10px] font-bold text-[#091590] hover:underline self-center py-1 px-1"
                                        >
                                            + {formData.absentees.split(',').filter(name => name.trim()).length - 5} more [View more]
                                        </button>
                                    )}
                                    <input
                                        type="text"
                                        placeholder={formData.absentees ? "" : "None"}
                                        value={absenteesInput || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.includes(',')) {
                                                const newNames = val.split(',').map(n => n.trim()).filter(n => n);
                                                const existing = formData.absentees.split(',').map(n => n.trim()).filter(n => n);
                                                setFormData({ ...formData, absentees: [...existing, ...newNames].join(', ') });
                                                setAbsenteesInput('');
                                            } else {
                                                setAbsenteesInput(val);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && absenteesInput.trim()) {
                                                e.preventDefault();
                                                const existing = formData.absentees.split(',').map(n => n.trim()).filter(n => n);
                                                setFormData({ ...formData, absentees: [...existing, absenteesInput.trim()].join(', ') });
                                                setAbsenteesInput('');
                                            } else if (e.key === 'Backspace' && !absenteesInput && formData.absentees) {
                                                const names = formData.absentees.split(',').map(n => n.trim()).filter(n => n);
                                                names.pop();
                                                setFormData({ ...formData, absentees: names.join(', ') });
                                            }
                                        }}
                                        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 py-0.5"
                                    />
                                </div>

                                {/* Localized Popup for Absentees */}
                                {absenteesShowAll && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setAbsenteesShowAll(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl z-[70] p-4 animate-in fade-in zoom-in duration-200 origin-top">
                                            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Absentees</h3>
                                                <button onClick={() => setAbsenteesShowAll(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                <ol className="list-decimal pl-5 space-y-1.5">
                                                    {formData.absentees.split(',').filter(name => name.trim()).map((name, idx) => (
                                                        <li key={idx} className="text-sm font-medium text-gray-700 group flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                            <span className="flex-1 truncate">{name.trim()}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const names = formData.absentees.split(',').filter(n => n.trim());
                                                                    names.splice(idx, 1);
                                                                    const newVal = names.join(', ');
                                                                    setFormData({ ...formData, absentees: newVal });
                                                                    if (names.length <= 5) setAbsenteesShowAll(false);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </div>
                                    </>
                                )}
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
