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
    const TARGET_MIN_ROWS = 8;
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
        <div className="mom-print-overlay fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:bg-transparent print:backdrop-blur-none">
            {/* Print specific CSS */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 14mm 12mm;
                    }
                    html, body {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                        background-color: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide everything that is not the MOM document or an ancestor of it.
                       This prevents blank/black trailing pages from the modal overlay and app layout. */
                    body *:not(#printable-mom-container):not(#printable-mom-container *):not(:has(#printable-mom-container)) {
                        display: none !important;
                    }
                    /* Flatten ancestors so they do not clip, pad, or paint dark backgrounds */
                    body, body *:has(#printable-mom-container) {
                        display: block !important;
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        min-height: 0 !important;
                        width: auto !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                        background-color: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        transform: none !important;
                        backdrop-filter: none !important;
                        flex: none !important;
                        float: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #printable-mom-container {
                        display: block !important;
                        position: static !important;
                        left: auto !important;
                        top: auto !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        background-color: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        min-height: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    #printable-mom-container * {
                        visibility: visible !important;
                    }
                    #printable-mom-container table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        margin: 0 0 10px 0 !important;
                    }
                    #printable-mom-container thead {
                        display: table-header-group !important;
                    }
                    #printable-mom-container tbody {
                        display: table-row-group !important;
                    }
                    #printable-mom-container tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    #printable-mom-container td,
                    #printable-mom-container th {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        padding: 8px 10px !important;
                        vertical-align: middle !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="mom-print-shell bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
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
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#091590] hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            Print
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
                <div className="mom-print-scroll flex-1 overflow-y-auto p-6 sm:p-8 pb-16 bg-gray-50/50 custom-scrollbar">
                    <div
                        id="printable-mom-container"
                        className="bg-white p-6 sm:p-8 print:p-0 rounded-xl border border-gray-300 print:border-none shadow-sm print:shadow-none max-w-4xl mx-auto space-y-4 text-black text-xs uppercase flex flex-col print:block print:min-h-0 print:mb-0 mb-8"
                    >
                        <div className="space-y-4 print:space-y-3">
                            {/* Section 1: NO OF PEOPLE / LOCATION / DATE */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2.5 px-3 w-1/4 align-middle">NO OF PEOPLE</th>
                                        <th className="border border-gray-800 py-2.5 px-3 w-1/2 align-middle">LOCATION</th>
                                        <th className="border border-gray-800 py-2.5 px-3 w-1/4 align-middle">DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-3 px-3 align-middle">{getNumberOfPeople(meeting)}</td>
                                        <td className="border border-gray-800 py-3 px-3 align-middle">{meeting.location || 'TESLEAD EQUIPMENTS PVT LTD ,COIMBATORE'}</td>
                                        <td className="border border-gray-800 py-3 px-3 align-middle">{formattedDate}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 2: PURPOSE OF MEETING */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2.5 px-3 align-middle">PURPOSE OF MEETING</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-3 px-3 align-middle">{meeting.purpose || 'DAILY INTERNAL MEETING'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 3: ATTENDED BY */}
                            <table className="w-full border-collapse border border-gray-800 text-center font-bold">
                                <thead>
                                    <tr className="bg-[#404040] text-white">
                                        <th className="border border-gray-800 py-2.5 px-3 align-middle">ATTENDED BY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 py-3 px-3 leading-relaxed align-middle">
                                            {meeting.attendedBy || 'N/A'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Section 4: MAIN DISCUSSION TABLE */}
                            <table className="w-full border-collapse border border-gray-800">
                                <thead>
                                    <tr className="bg-[#404040] text-white text-center font-bold">
                                        <th className="border border-gray-800 py-2.5 px-2 w-12 align-middle">SNO</th>
                                        <th className="border border-gray-800 py-2.5 px-3 text-left align-middle">INSPECTION & DISCUSSION POINTS</th>
                                        <th className="border border-gray-800 py-2.5 px-3 w-40 align-middle">PROJECT</th>
                                        {!isClientMode && <th className="border border-gray-800 py-2.5 px-3 w-44 align-middle">ASSIGNED TO</th>}
                                        {!isClientMode && <th className="border border-gray-800 py-2.5 px-2 w-28 align-middle">STATUS</th>}
                                        <th className="border border-gray-800 py-2.5 px-3 w-36 align-middle">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discussionRows.map((row: any, idx: number) => {
                                        const isPad = row.isPad;
                                        return (
                                            <tr key={row.id || idx} className="text-gray-900 font-semibold align-middle">
                                                <td className="border border-gray-800 py-2.5 px-2 text-center font-bold align-middle">{idx + 1}</td>
                                                <td className="border border-gray-800 py-2.5 px-3 text-left leading-normal whitespace-pre-wrap break-words align-middle">
                                                    {isPad ? '\u00A0' : (row.discussionPoints || '-')}
                                                </td>
                                                <td className="border border-gray-800 py-2.5 px-3 text-center font-semibold break-words align-middle">
                                                    {isPad ? '\u00A0' : (row.project || '-')}
                                                </td>
                                                {!isClientMode && (
                                                    <td className="border border-gray-800 py-2.5 px-3 text-center break-words align-middle">
                                                        {isPad ? '\u00A0' : (row.user || '-')}
                                                    </td>
                                                )}
                                                {!isClientMode && (
                                                    <td className="border border-gray-800 py-2.5 px-2 text-center font-bold align-middle">
                                                        {isPad ? '\u00A0' : (row.status || 'OPEN')}
                                                    </td>
                                                )}
                                                <td className="border border-gray-800 py-2.5 px-3 text-left break-words align-middle">
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
