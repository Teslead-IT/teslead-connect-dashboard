import React, { useState } from 'react';
import { Printer, Download, X, UserCheck, ShieldAlert, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';
import { exportMomToExcel, getNumberOfPeople } from '@/utils/mom-excel-export';
import { cn } from '@/lib/utils';

export type MomPrintMode = 'internal' | 'client';

interface MomPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: any;
    initialMode?: MomPrintMode;
}

export function MomPrintModal({ isOpen, onClose, meeting, initialMode = 'internal' }: MomPrintModalProps) {
    const [mode, setMode] = useState<MomPrintMode>(initialMode);

    // Sync initialMode when modal opens or initialMode prop changes
    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    if (!isOpen || !meeting) return null;

    const formattedDate = meeting.meetingDate
        ? format(new Date(meeting.meetingDate), 'dd/MM/yy')
        : format(new Date(), 'dd/MM/yy');

    let rawDiscussionRows: any[] = [];
    if (meeting.content && typeof meeting.content === 'object' && Array.isArray(meeting.content.rows)) {
        rawDiscussionRows = meeting.content.rows.filter((r: any) =>
            Boolean(r.user?.trim() || r.project?.trim() || r.discussionPoints?.trim() || r.remarks?.trim())
        );
    } else if (typeof meeting.content === 'string' && meeting.content.trim()) {
        rawDiscussionRows = [{ id: '1', sno: 1, discussionPoints: meeting.content, user: '', status: 'OPEN', remarks: '' }];
    }

    if (rawDiscussionRows.length === 0) {
        rawDiscussionRows = [
            { id: 'empty-1', sno: 1, discussionPoints: 'NO DISCUSSION POINTS RECORDED', user: '-', status: 'OPEN', remarks: '-' }
        ];
    }

    // Pad rows to minimum 8 rows for a full, professional paper document layout
    const TARGET_MIN_ROWS = 16;
    const discussionRows = [...rawDiscussionRows];
    if (discussionRows.length < TARGET_MIN_ROWS) {
        const padCount = TARGET_MIN_ROWS - discussionRows.length;
        for (let i = 0; i < padCount; i++) {
            discussionRows.push({
                id: `pad-${i}`,
                isPad: true,
                sno: rawDiscussionRows.length + i + 1,
                discussionPoints: '',
                project: '',
                user: '',
                status: '',
                remarks: '',
            });
        }
    }

    const handlePrint = () => {
        window.print();
    };

    const isClientMode = mode === 'client';

    return (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            {/* Print specific CSS */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-mom-container, #printable-mom-container * {
                        visibility: visible !important;
                    }
                    #printable-mom-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important; 
                        padding: 12mm !important;
                        margin: 0 !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header Modal Bar (Hidden during print) */}
                <div className="no-print bg-[#091590] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 relative pr-14">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                            <Printer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold">Minutes of Meeting (MOM) Preview</h2>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                    isClientMode ? "bg-amber-400 text-gray-900 border-amber-300" : "bg-blue-400/20 text-blue-100 border-blue-300/30"
                                )}>
                                    {isClientMode ? 'Client Format' : 'Internal Format'}
                                </span>
                            </div>
                            <p className="text-xs text-white/70">{meeting.title || 'Meeting Document'}</p>
                        </div>
                    </div>

                    {/* Format Toggle & Action Buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Mode Selector Toggle */}
                        {/* <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/20">
                            <button
                                type="button"
                                onClick={() => setMode('internal')}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    !isClientMode ? "bg-white text-[#091590] shadow-sm" : "text-white/80 hover:text-white"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Internal</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('client')}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                    isClientMode ? "bg-amber-400 text-gray-900 shadow-sm" : "text-white/80 hover:text-white"
                                )}
                            >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Client</span>
                            </button>
                        </div> */}

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#091590] hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                            {/* {isClientMode ? 'Client MOM' : 'Internal MOM'} */}
                        </button>
                        <button
                            onClick={() => exportMomToExcel(meeting)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Excel
                        </button>
                    </div>

                    {/* Close Modal Button - Positioned in top-right corner */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer z-10"
                        title="Close preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Printable Document Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div
                        id="printable-mom-container"
                        className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm max-w-4xl mx-auto space-y-4 text-black text-xs uppercase flex flex-col justify-between min-h-[750px]"
                    >
                        <div className="space-y-4">
                            {/* Section 1: NO OF PEOPLE / LOCATION / DATE */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2 px-3 w-1/4">NO OF PEOPLE</th>
                                        <th className="border border-gray-800 py-2 px-3 w-1/2">LOCATION</th>
                                        <th className="border border-gray-800 py-2 px-3 w-1/4">DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-2 px-3">{getNumberOfPeople(meeting)}</td>
                                        <td className="border border-gray-800 py-2 px-3">{meeting.location || 'TESLEAD EQUIPMENTS PVT LTD ,COIMBATORE'}</td>
                                        <td className="border border-gray-800 py-2 px-3">{formattedDate}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 2: PURPOSE OF MEETING */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2 px-3">PURPOSE OF MEETING</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-2 px-3">{meeting.purpose || 'DAILY INTERNAL MEETING'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 3: ATTENDED BY */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2 px-3">ATTENDED BY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-2.5 px-3 leading-relaxed">
                                            {meeting.attendedBy || 'N/A'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 4: MAIN DISCUSSION TABLE */}
                            <table className="w-full border-collapse border border-gray-800">
                                <thead>
                                    <tr className="bg-[#404040] text-white text-center font-bold">
                                        <th className="border border-gray-800 py-2 px-2 w-12">SNO</th>
                                        <th className="border border-gray-800 py-2 px-3 text-left">INSPECTION & DISCUSSION POINTS</th>
                                        <th className="border border-gray-800 py-2 px-3 w-40">PROJECT</th>
                                        {!isClientMode && <th className="border border-gray-800 py-2 px-3 w-44">ASSIGNED TO</th>}
                                        {!isClientMode && <th className="border border-gray-800 py-2 px-2 w-28">STATUS</th>}
                                        <th className="border border-gray-800 py-2 px-3 w-36">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discussionRows.map((row: any, idx: number) => {
                                        const isPad = row.isPad;
                                        return (
                                            <tr key={row.id || idx} className="text-gray-900 font-semibold h-10">
                                                <td className="border border-gray-800 py-2 px-2 text-center font-bold">{idx + 1}</td>
                                                <td className="border border-gray-800 py-2 px-3 text-left leading-normal whitespace-pre-wrap">
                                                    {isPad ? '\u00A0' : (row.discussionPoints || '-')}
                                                </td>
                                                <td className="border border-gray-800 py-2 px-3 text-center font-semibold">
                                                    {isPad ? '\u00A0' : (row.project || '-')}
                                                </td>
                                                {!isClientMode && (
                                                    <td className="border border-gray-800 py-2 px-3 text-center">
                                                        {isPad ? '\u00A0' : (row.user || '-')}
                                                    </td>
                                                )}
                                                {!isClientMode && (
                                                    <td className="border border-gray-800 py-2 px-2 text-center font-bold">
                                                        {isPad ? '\u00A0' : (row.status || 'OPEN')}
                                                    </td>
                                                )}
                                                <td className="border border-gray-800 py-2 px-3 text-left">
                                                    {isPad ? '\u00A0' : (row.remarks || '')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
