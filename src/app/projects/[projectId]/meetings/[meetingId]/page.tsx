'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import { ArrowLeft, Plus, Save, Download, Trash2 } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

interface MeetingPoint {
    sno: number;
    description: string;
    remark: string;
}

interface Meeting {
    id: string;
    meetingDate: string;
    location: string;
    purpose?: string;
    noOfPeople: number;
    attendedBy?: string;
    absentees?: string;
    points: MeetingPoint[];
}

export default function ViewMeetingPage({ params }: { params: { projectId: string; meetingId: string } }) {
    const router = useRouter();
    const gridRef = useRef<AgGridReact>(null);
    const { projectId, meetingId } = params;

    const [loading, setLoading] = useState(true);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [meetingDate, setMeetingDate] = useState('');
    const [location, setLocation] = useState('');
    const [purpose, setPurpose] = useState('');
    const [noOfPeople, setNoOfPeople] = useState(0);
    const [attendedBy, setAttendedBy] = useState('');
    const [absentees, setAbsentees] = useState('');
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [rowData, setRowData] = useState<MeetingPoint[]>([]);

    useEffect(() => {
        fetchMeeting();
    }, [meetingId]);

    const fetchMeeting = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data: Meeting = response.data;
            setMeeting(data);
            setMeetingDate(data.meetingDate.split('T')[0]);
            setLocation(data.location);
            setPurpose(data.purpose || '');
            setNoOfPeople(data.noOfPeople);
            setAttendedBy(data.attendedBy || '');
            setAbsentees(data.absentees || '');
            setRowData(data.points.sort((a, b) => a.sno - b.sno));
            setError(null);
        } catch (err: any) {
            console.error('Error fetching meeting:', err);
            setError(err.response?.data?.message || 'Failed to load meeting');
        } finally {
            setLoading(false);
        }
    };

    const columnDefs = useMemo(
        () => [
            {
                headerName: 'SNO',
                field: 'sno',
                editable: false,
                width: 80,
                cellStyle: { backgroundColor: '#f9fafb', fontWeight: '600' },
            },
            {
                headerName: 'INSPECTION & DISCUSSION POINTS',
                field: 'description',
                editable: true,
                flex: 2,
                wrapText: true,
                autoHeight: true,
                cellEditor: 'agLargeTextCellEditor',
                cellEditorParams: {
                    maxLength: 500,
                    rows: 3,
                    cols: 50,
                },
            },
            {
                headerName: 'REMARKS',
                field: 'remark',
                editable: true,
                flex: 1,
                wrapText: true,
                autoHeight: true,
                cellEditor: 'agLargeTextCellEditor',
                cellEditorParams: {
                    maxLength: 300,
                    rows: 3,
                    cols: 30,
                },
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            sortable: false,
            filter: false,
        }),
        []
    );

    const addRow = useCallback(() => {
        const newRow: MeetingPoint = {
            sno: rowData.length + 1,
            description: '',
            remark: '',
        };
        setRowData([...rowData, newRow]);
    }, [rowData]);

    const removeLastRow = useCallback(() => {
        if (rowData.length > 1) {
            const updated = rowData.slice(0, -1).map((row, index) => ({
                ...row,
                sno: index + 1,
            }));
            setRowData(updated);
        }
    }, [rowData]);

    const updateMeeting = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const token = localStorage.getItem('token');
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}`,
                {
                    meetingDate,
                    location,
                    purpose,
                    noOfPeople,
                    attendedBy,
                    absentees,
                    points: rowData.filter((row) => row.description.trim() !== ''),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error updating meeting:', err);
            setError(err.response?.data?.message || 'Failed to update meeting');
        } finally {
            setSaving(false);
        }
    };

    const exportToExcel = async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/meetings/${meetingId}/export`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob',
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `meeting-${meetingId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error exporting meeting:', err);
            setError('Failed to export meeting');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    Meeting not found
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">MINUTES OF MEETING</h1>
                        <p className="text-sm text-gray-600 mt-1">View and edit meeting details</p>
                    </div>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#091590] text-white rounded-lg hover:bg-[#0a1a7a] transition-colors font-medium disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                    ✓ Meeting updated successfully!
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Meeting Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                            DATE
                        </label>
                        <input
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                            LOCATION
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                            NO OF PEOPLE
                        </label>
                        <input
                            type="number"
                            value={noOfPeople}
                            onChange={(e) => setNoOfPeople(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                            min="0"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                        PURPOSE OF MEETING
                    </label>
                    <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                            ATTENDED BY
                        </label>
                        <textarea
                            value={attendedBy}
                            onChange={(e) => setAttendedBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-200 px-3 py-2 rounded">
                            ABSENTEES
                        </label>
                        <textarea
                            value={absentees}
                            onChange={(e) => setAbsentees(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#091590] focus:border-transparent"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {/* AG Grid Spreadsheet */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Discussion Points</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Row
                        </button>
                        {rowData.length > 1 && (
                            <button
                                onClick={removeLastRow}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Remove Last
                            </button>
                        )}
                    </div>
                </div>

                <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        stopEditingWhenCellsLoseFocus={true}
                        singleClickEdit={true}
                        onCellValueChanged={(params) => {
                            const updatedData = [...rowData];
                            updatedData[params.node.rowIndex!] = params.data;
                            // Ensure SNO stays consistent
                            const renumbered = updatedData.map((row, index) => ({
                                ...row,
                                sno: index + 1,
                            }));
                            setRowData(renumbered);
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={updateMeeting}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Update Meeting'}
                </button>
            </div>
        </div>
    );
}
