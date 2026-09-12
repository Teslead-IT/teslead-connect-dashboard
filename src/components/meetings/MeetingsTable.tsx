'use client';

import React, { useState } from 'react';
import { useMeetings } from '@/hooks/use-meetings';
import { Download, FileSpreadsheet, Calendar, MapPin, Printer, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { MomPrintModal } from '@/components/meetings/MomPrintModal';
import { getNumberOfPeople } from '@/utils/mom-excel-export';

interface MeetingsTableProps {
    onSelectMeeting?: (meetingId: string, meetingDate: string) => void;
}

export function MeetingsTable({ onSelectMeeting }: MeetingsTableProps) {
    const { data: meetingsData, isLoading } = useMeetings({ limit: 1000 });
    const meetings = meetingsData?.data || [];
    const [printModalMeeting, setPrintModalMeeting] = useState<any>(null);

    const exportToExcel = async () => {
        if (!meetings || meetings.length === 0) {
            alert('No meetings to export');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Meetings');

        // Define columns
        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 8 },
            { header: 'Project Name', key: 'projectName', width: 25 },
            { header: 'Project ID', key: 'projectId', width: 15 },
            { header: 'Meeting Date', key: 'meetingDate', width: 15 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Purpose', key: 'purpose', width: 30 },
            { header: 'No. of People', key: 'noOfPeople', width: 15 },
            { header: 'Attended By', key: 'attendedBy', width: 30 },
            { header: 'Absentees', key: 'absentees', width: 30 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF091590' },
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add data rows
        meetings.forEach((meeting, index) => {
            worksheet.addRow({
                sno: index + 1,
                projectName: meeting.project?.name || 'N/A',
                projectId: meeting.projectId,
                meetingDate: format(new Date(meeting.meetingDate), 'dd-MM-yyyy'),
                location: meeting.location,
                purpose: meeting.purpose || '',
                noOfPeople: getNumberOfPeople(meeting),
                attendedBy: meeting.attendedBy || '',
                absentees: meeting.absentees || '',
            });
        });

        // Add borders to all cells
        worksheet.eachRow((row: any) => {
            row.eachCell((cell: any) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        // Generate file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meetings_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader />
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                    No Meetings Found
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Create your first meeting to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Export Button */}
            <div className="flex justify-end">
                {/* <button
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm uppercase tracking-wider"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export to Excel
                </button> */}
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#091590] text-white">
                            <tr className="text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-3 py-2.5 text-center w-12 border-r border-blue-900/40">S.No</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Project Name</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Meeting Date</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Location</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Purpose</th>
                                <th className="px-3 py-2.5 text-center border-r border-blue-900/40">No. of People</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Attended By</th>
                                <th className="px-3 py-2.5 border-r border-blue-900/40">Absentees</th>
                                <th className="px-3 py-2.5 text-center border-r border-blue-900/40">MOM Print</th>
                                <th className="px-3 py-2.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                            {meetings.map((meeting: any, index: number) => {
                                const eventDate = meeting.meetingDate
                                    ? new Date(meeting.meetingDate).toISOString().split('T')[0]
                                    : new Date().toISOString().split('T')[0];
                                return (
                                    <tr key={meeting.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-3 py-2.5 text-center font-bold text-gray-500 bg-gray-50/50">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2" title={meeting.project?.name || meeting.title || '-'}>
                                                <div className="w-6 h-6 bg-[#091590]/10 rounded-md flex items-center justify-center flex-shrink-0">
                                                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#091590]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">
                                                        {meeting.project?.name || meeting.title || '-'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 truncate">
                                                        {meeting.projectId ? `ID: ${meeting.projectId}` : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5" title={format(new Date(meeting.meetingDate), 'dd MMM yyyy')}>
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-900 font-medium">
                                                    {format(new Date(meeting.meetingDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-1.5" title={meeting.location || '-'}>
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-700 truncate max-w-[120px]">
                                                    {meeting.location || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-xs text-gray-700 line-clamp-1" title={meeting.purpose || '-'}>
                                                {meeting.purpose || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 font-bold text-xs rounded-full" title={`${getNumberOfPeople(meeting)} People`}>
                                                {getNumberOfPeople(meeting)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-xs text-gray-600 line-clamp-1" title={meeting.attendedBy || '-'}>
                                                {meeting.attendedBy || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-xs text-gray-600 line-clamp-1" title={meeting.absentees || '-'}>
                                                {meeting.absentees || '-'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPrintModalMeeting(meeting);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#091590] text-white hover:bg-[#071170] font-bold text-[10px] uppercase rounded-md shadow-2xs transition-colors cursor-pointer"
                                                title="Print MOM document"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Print</span>
                                            </button>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onSelectMeeting?.(meeting.id, eventDate)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase rounded-md shadow-2xs transition-colors cursor-pointer"
                                                title="Edit Meeting"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Meetings: <span className="text-[#091590]">{meetings.length}</span>
                </p>
                <button
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-emerald-700 font-bold text-xs rounded border border-emerald-200 transition-colors cursor-pointer"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download Excel
                </button>
            </div>

            {/* MOM Print Preview Modal */}
            <MomPrintModal
                isOpen={!!printModalMeeting}
                onClose={() => setPrintModalMeeting(null)}
                meeting={printModalMeeting}
            />
        </div>
    );
}
