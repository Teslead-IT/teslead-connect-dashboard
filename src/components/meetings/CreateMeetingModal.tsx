'use client';

import React, { useState, useEffect } from 'react';
import { GenericDialog } from '@/components/ui/GenericDialog';
import { Button } from '@/components/ui/Button';
import { useProjects } from '@/hooks/use-projects';
import { useCreateMeeting, CreateMeetingRequest, MeetingPoint } from '@/hooks/use-meetings';
import { Plus, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate?: string;
}

export function CreateMeetingModal({ isOpen, onClose, selectedDate }: CreateMeetingModalProps) {
    const { data: projectsData } = useProjects({ orgId: 'all' });
    const createMeetingMutation = useCreateMeeting();

    const [formData, setFormData] = useState({
        projectId: '',
        meetingDate: selectedDate || new Date().toISOString().split('T')[0],
        location: '',
        purpose: '',
        noOfPeople: 0,
        attendedBy: '',
        absentees: '',
    });

    const [points, setPoints] = useState<MeetingPoint[]>([
        { sno: 1, description: '', remark: '' }
    ]);

    useEffect(() => {
        if (selectedDate) {
            setFormData(prev => ({ ...prev, meetingDate: selectedDate }));
        }
    }, [selectedDate]);

    const handleAddRow = () => {
        setPoints([...points, { sno: points.length + 1, description: '', remark: '' }]);
    };

    const handleDeleteRow = (index: number) => {
        const newPoints = points.filter((_, i) => i !== index);
        // Re-number the points
        const renumbered = newPoints.map((point, i) => ({ ...point, sno: i + 1 }));
        setPoints(renumbered);
    };

    const handlePointChange = (index: number, field: 'description' | 'remark', value: string) => {
        const newPoints = [...points];
        newPoints[index][field] = value;
        setPoints(newPoints);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.projectId) {
            alert('Please select a project');
            return;
        }

        const validPoints = points.filter(p => p.description.trim() !== '');

        const meetingData: CreateMeetingRequest = {
            projectId: formData.projectId,
            meetingDate: formData.meetingDate,
            location: formData.location,
            purpose: formData.purpose || undefined,
            noOfPeople: formData.noOfPeople,
            attendedBy: formData.attendedBy || undefined,
            absentees: formData.absentees || undefined,
            points: validPoints,
        };

        try {
            await createMeetingMutation.mutateAsync(meetingData);
            // Reset form
            setFormData({
                projectId: '',
                meetingDate: selectedDate || new Date().toISOString().split('T')[0],
                location: '',
                purpose: '',
                noOfPeople: 0,
                attendedBy: '',
                absentees: '',
            });
            setPoints([{ sno: 1, description: '', remark: '' }]);
            onClose();
        } catch (error: any) {
            console.error('Error creating meeting:', error);
            alert(error.response?.data?.message || 'Failed to create meeting');
        }
    };

    const projects = projectsData?.data || [];

    return (
        <GenericDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Meeting"
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Meeting Details */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Project Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Project *
                        </label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            className=" w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                            required
                        >
                            <option value="">Select Project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name} ({project.projectId})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Meeting Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Meeting Date *
                        </label>
                        <input
                            type="date"
                            value={formData.meetingDate}
                            onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Location *
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Conference Room A"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                            required
                        />
                    </div>

                    {/* No of People */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            No. of People *
                        </label>
                        <input
                            type="number"
                            value={formData.noOfPeople}
                            onChange={(e) => setFormData({ ...formData, noOfPeople: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                            required
                        />
                    </div>
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Purpose
                    </label>
                    <textarea
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="Purpose of the meeting"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590] resize-none"
                    />
                </div>

                {/* Attended By */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Attended By
                    </label>
                    <input
                        type="text"
                        value={formData.attendedBy}
                        onChange={(e) => setFormData({ ...formData, attendedBy: e.target.value })}
                        placeholder="Comma-separated names"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                    />
                </div>

                {/* Absentees */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Absentees
                    </label>
                    <input
                        type="text"
                        value={formData.absentees}
                        onChange={(e) => setFormData({ ...formData, absentees: e.target.value })}
                        placeholder="Comma-separated names"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091590] focus:border-[#091590]"
                    />
                </div>

                {/* Meeting Points - Excel-like Table */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Meeting Points
                        </label>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add Row
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16">
                                        S.No
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Remark
                                    </th>
                                    <th className="px-3 py-2 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {points.map((point, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-sm font-medium text-gray-500">
                                            {point.sno}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={point.description}
                                                onChange={(e) => handlePointChange(index, 'description', e.target.value)}
                                                placeholder="Enter discussion point"
                                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#091590] focus:border-[#091590]"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={point.remark || ''}
                                                onChange={(e) => handlePointChange(index, 'remark', e.target.value)}
                                                placeholder="Optional remark"
                                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#091590] focus:border-[#091590]"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            {points.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRow(index)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete row"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 px-6 py-4 -mx-6 -mb-4 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={createMeetingMutation.isPending}
                        className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMeetingMutation.isPending}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#091590] hover:bg-[#071170] text-white font-bold text-sm rounded-lg transition-all shadow-sm disabled:opacity-50"
                    >
                        {createMeetingMutation.isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                SUBMIT MEETING
                            </>
                        )}
                    </button>
                </div>
            </form>
        </GenericDialog>
    );
}
