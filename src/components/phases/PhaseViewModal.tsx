'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, Pencil, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdatePhase, useDeletePhase } from '@/hooks/use-phases';
import { useToast } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists } from '@/types/phase';
import type { UpdatePhasePayload } from '@/types/phase';

const INSET = 20;

interface PhaseViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    phases: PhaseWithTaskLists[];
    selectedPhaseId: string | null;
    isEditable?: boolean;
    onUpdated?: () => void;
    onDeleted?: () => void;
}

export function PhaseViewModal({
    isOpen,
    onClose,
    projectId,
    phases,
    selectedPhaseId,
    isEditable = true,
    onUpdated,
    onDeleted,
}: PhaseViewModalProps) {
    const toast = useToast();
    const [activePhaseId, setActivePhaseId] = useState<string | null>(selectedPhaseId);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editAccess, setEditAccess] = useState<'INTERNAL' | 'CLIENT'>('INTERNAL');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

    const updatePhaseMutation = useUpdatePhase(projectId);
    const deletePhaseMutation = useDeletePhase(projectId);

    const activePhase = phases.find((p) => p.id === activePhaseId);

    useEffect(() => {
        if (isOpen) setActivePhaseId(selectedPhaseId);
    }, [isOpen, selectedPhaseId]);

    useEffect(() => {
        if (activePhase) {
            setEditName(activePhase.name);
            setEditStartDate(activePhase.startDate || '');
            setEditEndDate(activePhase.endDate || '');
            setEditAccess(activePhase.access === 'CLIENT' ? 'CLIENT' : 'INTERNAL');
        }
    }, [activePhase]);

    useEffect(() => {
        if (!activePhaseId && phases.length > 0 && isOpen) setActivePhaseId(phases[0].id);
    }, [phases, activePhaseId, isOpen]);

    const handleSave = async () => {
        if (!activePhase) return;
        const payload: UpdatePhasePayload = { name: editName.trim(), access: editAccess };
        if (editStartDate) payload.startDate = editStartDate;
        else if (editStartDate === '') payload.startDate = undefined;
        if (editEndDate) payload.endDate = editEndDate;
        else if (editEndDate === '') payload.endDate = undefined;
        const tid = toast.loading('Saving...');
        try {
            await updatePhaseMutation.mutateAsync({ phaseId: activePhase.id, data: payload });
            toast.success('Phase updated', undefined, { id: tid });
            setIsEditMode(false);
            onUpdated?.();
        } catch {
            toast.error('Failed to update phase', undefined, { id: tid });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        const tid = toast.loading('Deleting...');
        try {
            await deletePhaseMutation.mutateAsync(deleteConfirm.id);
            toast.success('Phase deleted', undefined, { id: tid });
            setDeleteConfirm(null);
            if (activePhaseId === deleteConfirm.id) {
                const next = phases.filter((p) => p.id !== deleteConfirm.id);
                setActivePhaseId(next[0]?.id ?? null);
            }
            onDeleted?.();
            if (phases.length <= 1) onClose();
        } catch {
            toast.error('Failed to delete phase', undefined, { id: tid });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />
            <div
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                style={{ top: INSET, left: INSET, right: INSET, bottom: INSET }}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Phases</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[280px] border-r border-gray-100 bg-gray-50/50 flex flex-col flex-shrink-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {phases.map((p) => {
                                const isActive = activePhaseId === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setActivePhaseId(p.id); setIsEditMode(false); }}
                                        className={cn(
                                            'w-full text-left rounded-lg px-3 py-2.5 transition-all border',
                                            isActive
                                                ? 'bg-indigo-500 text-white border-indigo-500'
                                                : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50'
                                        )}
                                    >
                                        <div className="font-semibold text-sm truncate">{p.name}</div>
                                        <div className={cn('text-[10px] mt-0.5', isActive ? 'text-white/80' : 'text-gray-500')}>
                                            {(p.taskLists?.length ?? 0)} task list(s)
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {activePhase ? (
                            <div className="p-6 space-y-5">
                                {/* Top action bar - same as task modal */}
                                {isEditable && (
                                    <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                        {isEditMode ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleSave}
                                                    disabled={!editName.trim() || updatePhaseMutation.isPending}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#091590] hover:bg-[#071170] disabled:opacity-50 transition-colors rounded"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {updatePhaseMutation.isPending ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditMode(false)}
                                                    disabled={updatePhaseMutation.isPending}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditMode(true)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors rounded"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteConfirm({ id: activePhase.id, name: activePhase.name })}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                                    {isEditMode ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded"
                                            placeholder="Phase name"
                                        />
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{activePhase.name}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start date</label>
                                    {isEditMode ? (
                                        <input
                                            type="date"
                                            value={editStartDate}
                                            onChange={(e) => setEditStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded"
                                        />
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">
                                            {activePhase.startDate ? new Date(activePhase.startDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End date</label>
                                    {isEditMode ? (
                                        <input
                                            type="date"
                                            value={editEndDate}
                                            onChange={(e) => setEditEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded"
                                        />
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">
                                            {activePhase.endDate ? new Date(activePhase.endDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Access</label>
                                    {isEditMode ? (
                                        <select
                                            value={editAccess}
                                            onChange={(e) => setEditAccess(e.target.value as 'INTERNAL' | 'CLIENT')}
                                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] rounded cursor-pointer"
                                        >
                                            <option value="INTERNAL">Internal</option>
                                            <option value="CLIENT">Client</option>
                                        </select>
                                    ) : (
                                        <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{activePhase.access || 'INTERNAL'}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Task lists</label>
                                    <div className="px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm rounded">{(activePhase.taskLists?.length ?? 0)} task list(s) in this phase</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Layers className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium">Select a phase</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                type="warning"
                title="Delete Phase"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? All task lists and tasks in this phase will be deleted.`}
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={deletePhaseMutation.isPending}
            />
        </>
    );
}
