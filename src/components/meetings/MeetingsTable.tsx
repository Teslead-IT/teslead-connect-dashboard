'use client';

import React from 'react';
import { useMeetings } from '@/hooks/use-meetings';
import { Download, FileSpreadsheet, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';

export function MeetingsTable() {
    const { data: meetingsData, isLoading } = useMeetings();
    const meetings = meetingsData?.data || [];

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
                noOfPeople: (meeting as any).numberOfPeople || (meeting as any).noOfPeople,
                attendedBy: meeting.attendedBy || '',
                absentees: meeting.absentees || '',
            });
        });

        // Add borders to all cells
        worksheet.eachRow((row: any, rowNumber: number) => {
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
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#091590] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500">Loading meetings...</p>
                </div>
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
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
                <button
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm uppercase tracking-wider"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export to Excel
                </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#091590] text-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    S.No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Project Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Meeting Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Purpose
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    No. of People
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Attended By
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                    Absentees
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {meetings.map((meeting: any, index: number) => (
                                <tr key={meeting.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-[#091590]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileSpreadsheet className="w-4 h-4 text-[#091590]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {meeting.title || meeting.project?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {meeting.projectId}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900 font-medium">
                                                {format(new Date(meeting.meetingDate), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">
                                                {meeting.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            {meeting.purpose || '-'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">
                                            {meeting.numberOfPeople || meeting.noOfPeople || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                            {meeting.attendedBy || '-'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                            {meeting.absentees || '-'}
                                        </p>
                                    </td>
                                </tr>
                            ))}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-emerald-700 font-bold text-xs rounded border border-emerald-200 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download Excel
                </button>
            </div>
        </div>
    );
}
