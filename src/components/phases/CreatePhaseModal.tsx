'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, Lock } from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import { useCreatePhase } from '@/hooks/use-phases';
import { useToast } from '@/components/ui/Toast';
import type { CreatePhasePayload } from '@/types/phase';
import type { Project } from '@/types/project';

interface CreatePhaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProjectId: string;
    onSuccess?: () => void;
}

const ACCESS_OPTIONS: { value: 'PUBLIC' | 'PRIVATE'; label: string }[] = [
    { value: 'PUBLIC', label: 'Public' },
    { value: 'PRIVATE', label: 'Private' },
];

export function CreatePhaseModal({
    isOpen,
    onClose,
    currentProjectId,
    onSuccess,
}: CreatePhaseModalProps) {
    const toast = useToast();
    const { data: projectsData } = useProjects({ limit: 200 });
    const projects: Project[] = projectsData?.data ?? [];

    const [projectId, setProjectId] = useState(currentProjectId);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [access, setAccess] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');

    const createPhaseMutation = useCreatePhase(currentProjectId);

    useEffect(() => {
        if (isOpen) {
            setProjectId(currentProjectId);
            setName('');
            setStartDate('');
            setEndDate('');
            setAccess('PRIVATE');
        }
    }, [isOpen, currentProjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Phase name is required');
            return;
        }
        const payload: CreatePhasePayload = {
            projectId,
            name: name.trim(),
            access,
        };
        if (startDate) payload.startDate = startDate;
        if (endDate) payload.endDate = endDate;

        const tid = toast.loading('Creating phase...');
        try {
            await createPhaseMutation.mutateAsync(payload);
            toast.success('Phase created', undefined, { id: tid });
            onSuccess?.();
            onClose();
        } catch {
            toast.error('Failed to create phase', undefined, { id: tid });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop - no close on click */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" aria-hidden />

            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Create Phase</h2>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Add a new phase to a project</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto">
                    <form id="create-phase-form" className="p-5 space-y-5" onSubmit={handleSubmit}>
                        {/* Project */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Project <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] appearance-none bg-white transition-all cursor-pointer"
                                required
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                        {p.id === currentProjectId ? ' (current)' : ''}
                                        {p.projectId ? ` · ${p.projectId}` : ''}
                                    </option>
                                ))}
                            </select>
                            {projects.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">No projects available</p>
                            )}
                        </div>

                        {/* Phase name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                Phase name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Planning, Development, Testing"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] placeholder:text-gray-300 transition-all"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Access */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Lock className="w-3 h-3" /> Access
                            </label>
                            <select
                                value={access}
                                onChange={(e) => setAccess(e.target.value as 'PUBLIC' | 'PRIVATE')}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] appearance-none bg-white transition-all cursor-pointer"
                            >
                                {ACCESS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start date */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Start date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                            />
                        </div>

                        {/* End date */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> End date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={createPhaseMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-phase-form"
                        disabled={createPhaseMutation.isPending || !name.trim()}
                        className="px-5 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[110px] cursor-pointer"
                    >
                        {createPhaseMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Create Phase'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
