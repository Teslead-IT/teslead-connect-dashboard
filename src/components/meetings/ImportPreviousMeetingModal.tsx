'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Check, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { meetingsApi, MeetingResponse } from '@/services/meetings.service';
import { DiscussionRow } from './DiscussionAreaTable';
import { cn } from '@/lib/utils';

interface ImportPreviousMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMeetingDate?: string;
    onImport: (importedData: {
        location?: string;
        purpose?: string;
        attendedBy?: string;
        absentees?: string;
        numberOfPeople?: number;
        rows: DiscussionRow[];
    }) => void;
}

function getYesterdayDateStr(dateStr?: string): string {
    const base = dateStr && !isNaN(Date.parse(dateStr)) ? new Date(dateStr + 'T00:00:00') : new Date();
    base.setDate(base.getDate() - 1);
    return base.toISOString().split('T')[0];
}

export function ImportPreviousMeetingModal({
    isOpen,
    onClose,
    currentMeetingDate,
    onImport,
}: ImportPreviousMeetingModalProps) {
    const [mode, setMode] = useState<'yesterday' | 'custom'>('yesterday');
    const yesterdayDate = getYesterdayDateStr(currentMeetingDate);
    const [customDate, setCustomDate] = useState<string>(yesterdayDate);

    const [isLoading, setIsLoading] = useState(false);
    const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');

    const targetDate = mode === 'yesterday' ? yesterdayDate : customDate;

    // Reset mode and custom date when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode('yesterday');
            const yd = getYesterdayDateStr(currentMeetingDate);
            setCustomDate(yd);
        }
    }, [isOpen, currentMeetingDate]);

    // Fetch meetings whenever targetDate or isOpen changes
    useEffect(() => {
        if (!isOpen || !targetDate) return;

        let isMounted = true;
        setIsLoading(true);
        setMeetings([]);
        setSelectedMeetingId('');

        meetingsApi.getAll({ fromDate: targetDate, toDate: targetDate, limit: 100 })
            .then((res) => {
                if (!isMounted) return;
                const fetchedList = res.data || [];
                setMeetings(fetchedList);
                if (fetchedList.length > 0) {
                    setSelectedMeetingId(fetchedList[0].id);
                }
            })
            .catch((err) => {
                console.error('[ImportPreviousMeetingModal] Failed to fetch meetings:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, targetDate]);

    if (!isOpen) return null;

    const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

    // Extract discussion rows from selected meeting content
    let rawRows: DiscussionRow[] = [];
    if (selectedMeeting?.content) {
        if (typeof selectedMeeting.content === 'object' && Array.isArray(selectedMeeting.content.rows)) {
            rawRows = selectedMeeting.content.rows;
        } else if (typeof selectedMeeting.content === 'string' && selectedMeeting.content.trim()) {
            rawRows = [
                {
                    id: 'legacy-1',
                    sno: 1,
                    user: '',
                    project: '',
                    discussionPoints: selectedMeeting.content,
                    status: 'OPEN',
                    remarks: '',
                },
            ];
        }
    }

    // IGNORE / FILTER OUT items with status === 'COMPLETED'
    const nonCompletedRows = rawRows.filter(
        (r) => (r.status || '').toUpperCase() !== 'COMPLETED'
    );
    const completedCount = rawRows.length - nonCompletedRows.length;

    const handleConfirmImport = () => {
        if (!selectedMeeting) return;

        const freshRows: DiscussionRow[] = nonCompletedRows.map((r, index) => ({
            ...r,
            id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sno: index + 1,
        }));

        onImport({
            location: selectedMeeting.location || undefined,
            purpose: selectedMeeting.purpose || undefined,
            attendedBy: selectedMeeting.attendedBy || undefined,
            absentees: selectedMeeting.absentees || undefined,
            numberOfPeople: selectedMeeting.numberOfPeople || undefined,
            rows: freshRows,
        });

        onClose();
    };

    const formattedTargetDate = targetDate
        ? new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : '';

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

            {/* Modal Dialog */}
            <div className="fixed z-[10001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#091590] to-[#1e3a8a] px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <RotateCcw className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight">Import Previous Meeting Data</h3>
                            <p className="text-xs text-blue-100/80">Pre-fill details and open discussion items from past meetings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Date Selector Options */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Select Source Date
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Option 1: Yesterday */}
                            <button
                                type="button"
                                onClick={() => setMode('yesterday')}
                                className={cn(
                                    "flex flex-col items-start p-3 rounded-xl border transition-all text-left relative",
                                    mode === 'yesterday'
                                        ? "bg-blue-50/80 border-[#091590] text-[#091590] shadow-sm ring-1 ring-[#091590]"
                                        : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-bold uppercase tracking-wider">Yesterday (Default)</span>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center",
                                        mode === 'yesterday' ? "border-[#091590] bg-[#091590] text-white" : "border-gray-300"
                                    )}>
                                        {mode === 'yesterday' && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-1">
                                    {yesterdayDate}
                                </span>
                            </button>

                            {/* Option 2: Custom Date */}
                            <button
                                type="button"
                                onClick={() => setMode('custom')}
                                className={cn(
                                    "flex flex-col items-start p-3 rounded-xl border transition-all text-left relative",
                                    mode === 'custom'
                                        ? "bg-blue-50/80 border-[#091590] text-[#091590] shadow-sm ring-1 ring-[#091590]"
                                        : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-bold uppercase tracking-wider">Custom Single Date</span>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center",
                                        mode === 'custom' ? "border-[#091590] bg-[#091590] text-white" : "border-gray-300"
                                    )}>
                                        {mode === 'custom' && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-1">
                                    Choose specific date
                                </span>
                            </button>
                        </div>

                        {/* Date Input if Custom mode */}
                        {mode === 'custom' && (
                            <div className="mt-3">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Pick Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#091590] focus:ring-1 focus:ring-[#091590]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Date Header */}
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-xs">
                        <span className="text-gray-500 font-medium">Querying Date:</span>
                        <span className="font-bold text-gray-900">{formattedTargetDate}</span>
                    </div>

                    {/* Meetings List / Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Select Meeting
                        </label>

                        {isLoading ? (
                            <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin text-[#091590] mb-2" />
                                <span className="text-xs font-medium">Searching meetings for {targetDate}...</span>
                            </div>
                        ) : meetings.length === 0 ? (
                            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-center space-y-1">
                                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                                <p className="text-xs font-bold text-amber-800">No meetings found</p>
                                <p className="text-[11px] text-amber-700">There are no meeting records on {targetDate}. Try selecting another date.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {meetings.length > 1 && (
                                    <select
                                        value={selectedMeetingId}
                                        onChange={(e) => setSelectedMeetingId(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#091590]"
                                    >
                                        {meetings.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title || 'Untitled Meeting'} ({m.time || 'No time'})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {selectedMeeting && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900">{selectedMeeting.title || 'Untitled Meeting'}</h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {selectedMeeting.time || 'No time set'}
                                                </span>
                                                {selectedMeeting.location && (
                                                    <span>📍 {selectedMeeting.location}</span>
                                                )}
                                            </div>
                                        </div>

                                        {selectedMeeting.purpose && (
                                            <p className="text-xs text-gray-600 italic bg-white p-2 rounded border border-gray-100">
                                                "{selectedMeeting.purpose}"
                                            </p>
                                        )}

                                        {/* Import Stats Badge */}
                                        <div className="pt-2 border-t border-gray-200/80 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-gray-700">Discussion Items:</span>
                                                <span className="font-bold text-gray-900">{rawRows.length} Total</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>{nonCompletedRows.length} items to pre-fill</span>
                                                </div>

                                                {completedCount > 0 && (
                                                    <div className="bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5" title="Completed items are excluded as requested">
                                                        <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{completedCount} completed ignored</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200/60 transition-colors uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={!selectedMeeting || (nonCompletedRows.length === 0 && !selectedMeeting?.location && !selectedMeeting?.purpose)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-[#091590] hover:bg-[#071170] text-white shadow-sm transition-all uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Import & Pre-fill Data</span>
                    </button>
                </div>
            </div>
        </>
    );
}
