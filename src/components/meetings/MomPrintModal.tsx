'use client';

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { exportMomToExcel, getNumberOfPeople } from '@/utils/mom-excel-export';

interface MomPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: any;
}

export function MomPrintModal({ isOpen, onClose, meeting }: MomPrintModalProps) {
    if (!isOpen || !meeting) return null;

    const formattedDate = meeting.meetingDate
        ? format(new Date(meeting.meetingDate), 'dd/MM/yy')
        : format(new Date(), 'dd/MM/yy');

    let discussionRows: any[] = [];
    if (meeting.content && typeof meeting.content === 'object' && Array.isArray(meeting.content.rows)) {
        discussionRows = meeting.content.rows.filter((r: any) =>
            Boolean(r.user?.trim() || r.project?.trim() || r.discussionPoints?.trim() || r.remarks?.trim())
        );
    } else if (typeof meeting.content === 'string' && meeting.content.trim()) {
        discussionRows = [{ id: '1', sno: 1, discussionPoints: meeting.content, user: '', status: 'OPEN', remarks: '' }];
    }

    if (discussionRows.length === 0) {
        discussionRows = [
            { id: 'empty-1', sno: 1, discussionPoints: 'NO DISCUSSION POINTS RECORDED', user: '-', status: 'OPEN', remarks: '-' }
        ];
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            {/* Print specific CSS */}
            <style jsx global>{`
                @media print {
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
                        padding: 20px !important;
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header Modal Bar (Hidden during print) */}
                <div className="no-print bg-[#091590] text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                            <Printer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Minutes of Meeting (MOM) Preview</h2>
                            <p className="text-xs text-white/70">{meeting.title || 'Meeting Document'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#091590] hover:bg-blue-50 font-bold text-xs rounded-lg transition-all shadow-sm uppercase tracking-wider"
                        >
                            <Printer className="w-4 h-4" />
                            Print MOM
                        </button>
                        <button
                            onClick={() => exportMomToExcel(meeting)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm uppercase tracking-wider"
                        >
                            <Download className="w-4 h-4" />
                            Excel MOM
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div
                        id="printable-mom-container"
                        className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm max-w-4xl mx-auto space-y-4 text-black text-xs uppercase"
                    >
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
                                    <th className="border border-gray-800 py-2 px-3 w-36">PROJECT</th>
                                    <th className="border border-gray-800 py-2 px-3 w-44">ASSIGNED TO</th>
                                    <th className="border border-gray-800 py-2 px-2 w-28">STATUS</th>
                                    <th className="border border-gray-800 py-2 px-3 w-36">REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discussionRows.map((row: any, idx: number) => {
                                    return (
                                        <tr key={row.id || idx} className="text-gray-900 font-semibold">
                                            <td className="border border-gray-800 py-2 px-2 text-center font-bold">{idx + 1}</td>
                                            <td className="border border-gray-800 py-2 px-3 text-left leading-normal whitespace-pre-wrap" title={row.discussionPoints}>
                                                {row.discussionPoints || '-'}
                                            </td>
                                            <td className="border border-gray-800 py-2 px-3 text-center font-semibold" title={row.project || '-'}>
                                                {row.project || '-'}
                                            </td>
                                            <td className="border border-gray-800 py-2 px-3 text-center" title={row.user || '-'}>
                                                {row.user || '-'}
                                            </td>
                                            <td className="border border-gray-800 py-2 px-2 text-center font-bold" title={row.status}>
                                                {row.status || 'OPEN'}
                                            </td>
                                            <td className="border border-gray-800 py-2 px-3 text-left" title={row.remarks}>
                                                {row.remarks || ''}
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
    );
}
