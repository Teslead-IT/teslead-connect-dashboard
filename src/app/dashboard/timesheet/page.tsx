'use client';

import React, { useMemo, useState } from 'react';
import { useOrgStore } from '@/stores/orgStore';
import { useMyTimesheets, useTeamTimesheets, useSubmitTimesheet, useApproveTimesheet } from '@/hooks/use-timesheets';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Clock, Send, CheckCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Timesheet } from '@/types/time-entry';

function getWeekStart(d: Date): string {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function TimesheetPage() {
    const activeOrgRole = useOrgStore((s) => s.activeOrgRole);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

    const { data: orgSettings } = useOrgSettings();
    const requireApproval = orgSettings?.requireTimesheetApproval ?? true;
    const showTeamTab = activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN';

    const { data: mySheets, isLoading: myLoading } = useMyTimesheets(weekStart);
    const { data: teamSheets, isLoading: teamLoading } = useTeamTimesheets(weekStart);
    const submitTimesheet = useSubmitTimesheet();
    const approveTimesheet = useApproveTimesheet();

    const sheets = activeTab === 'my' ? mySheets : teamSheets;
    const isLoading = activeTab === 'my' ? myLoading : teamLoading;

    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(getWeekStart(d));
    };
    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(getWeekStart(d));
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet</h1>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={prevWeek}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
                            {formatWeekLabel(weekStart)}
                        </span>
                        <button
                            type="button"
                            onClick={nextWeek}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('my')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === 'my'
                                ? 'border-[#091590] text-[#091590]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <Clock className="w-4 h-4 inline-block mr-2 align-middle" />
                        My Timesheet
                    </button>
                    {showTeamTab && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('team')}
                            className={cn(
                                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                                activeTab === 'team'
                                    ? 'border-[#091590] text-[#091590]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Users className="w-4 h-4 inline-block mr-2 align-middle" />
                            Team Timesheets
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader size={48} />
                    </div>
                ) : !sheets?.length ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No timesheet for this week</p>
                        <p className="text-sm text-gray-500 mt-1">Time entries will appear here once logged.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sheets.map((sheet: Timesheet) => (
                            <TimesheetCard
                                key={sheet.id}
                                sheet={sheet}
                                requireApproval={requireApproval}
                                isOwn={activeTab === 'my'}
                                onSubmit={() => submitTimesheet.mutate({ weekStart: sheet.weekStart })}
                                onApprove={() => approveTimesheet.mutate(sheet.id)}
                                isSubmitting={submitTimesheet.isPending}
                                isApproving={approveTimesheet.isPending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TimesheetCard({
    sheet,
    requireApproval,
    isOwn,
    onSubmit,
    onApprove,
    isSubmitting,
    isApproving,
}: {
    sheet: Timesheet;
    requireApproval: boolean;
    isOwn: boolean;
    onSubmit: () => void;
    onApprove: () => void;
    isSubmitting: boolean;
    isApproving: boolean;
}) {
    const totalHours = (sheet.totalMinutes ?? (sheet.entries?.reduce((s, e) => s + (e.durationMinutes || 0), 0) ?? 0)) / 60;
    const statusColor =
        sheet.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
        sheet.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
        'bg-gray-100 text-gray-700 border-gray-200';

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <Badge className={cn('text-xs font-semibold border', statusColor)}>{sheet.status}</Badge>
                    {!isOwn && <span className="text-sm text-gray-600">User: {sheet.userId}</span>}
                    <span className="text-sm text-gray-500">{totalHours.toFixed(1)}h total</span>
                </div>
                <div className="flex items-center gap-2">
                    {isOwn && sheet.status === 'DRAFT' && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#091590] text-white rounded-lg hover:bg-[#071170] disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Submit
                        </button>
                    )}
                    {!isOwn && requireApproval && sheet.status === 'SUBMITTED' && (
                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={isApproving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-2 font-semibold text-gray-600">Day</th>
                            <th className="px-4 py-2 font-semibold text-gray-600">Task</th>
                            <th className="px-4 py-2 font-semibold text-gray-600">Hours</th>
                            <th className="px-4 py-2 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(sheet.entries ?? []).map((entry) => (
                            <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                                <td className="px-4 py-2 text-gray-700">
                                    {new Date(entry.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-4 py-2 text-gray-900">{entry.taskId}</td>
                                <td className="px-4 py-2 font-mono">{(entry.durationMinutes / 60).toFixed(2)}</td>
                                <td className="px-4 py-2">
                                    <span className={cn(
                                        'text-xs font-medium',
                                        entry.timesheetStatus === 'APPROVED' && 'text-green-600',
                                        entry.timesheetStatus === 'SUBMITTED' && 'text-amber-600',
                                        entry.timesheetStatus === 'DRAFT' && 'text-gray-500'
                                    )}>
                                        {entry.timesheetStatus ?? sheet.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
