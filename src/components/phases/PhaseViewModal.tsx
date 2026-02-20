'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Calendar, Pencil, Trash2, Save, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdatePhase, useDeletePhase } from '@/hooks/use-phases';
import { useProject } from '@/hooks/use-projects';
import { useToast } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import type { PhaseWithTaskLists } from '@/types/phase';
import type { UpdatePhasePayload } from '@/types/phase';

const INSET = 20;
const ROUNDED = 'rounded';
const ROUNDED_MD = 'rounded-md';
const ROUNDED_LG = 'rounded-lg';
const ANIM_DURATION = 0.25;

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
    const { data: project } = useProject(projectId);
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="phase-view-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: ANIM_DURATION }}
                    className="fixed inset-0 z-[9998]"
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: ANIM_DURATION, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={cn("absolute z-10 bg-white shadow-2xl overflow-hidden flex flex-col", ROUNDED_LG)}
                        style={{ top: INSET, left: INSET, right: INSET, bottom: INSET }}
                    >
                        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 bg-gradient-to-br from-[#091590] to-[#2563eb] flex items-center justify-center shadow-md", ROUNDED)}>
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-2 overflow-hidden mr-4">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm whitespace-nowrap">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter leading-none">{project?.name || 'Project'}</span>
                                    </div>
                                    <span className="text-gray-300 text-[10px] font-medium">&gt;</span>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded shadow-sm whitespace-nowrap">
                                        <Layers className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[9px] font-medium text-indigo-500 uppercase tracking-tighter leading-none">Phases</span>
                                    </div>
                                    <span className="text-gray-300 text-[10px] font-medium">&gt;</span>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none truncate uppercase">{activePhase?.name || 'Select Phase'}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={cn("w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors", ROUNDED)}
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
                                                    'w-full text-left p-3 transition-all border outline-none',
                                                    ROUNDED,
                                                    isActive
                                                        ? 'bg-[#091590] text-white border-[#091590] shadow-sm'
                                                        : 'bg-white border-gray-100 hover:border-blue-200 text-gray-900'
                                                )}
                                            >
                                                <div className="font-bold text-sm truncate">{p.name}</div>
                                                <div className={cn('text-[10px] mt-1 flex items-center gap-1.5', isActive ? 'text-white/70' : 'text-gray-400')}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white/70" : "bg-indigo-400")} />
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
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#091590] hover:bg-[#071170] disabled:opacity-50 transition-colors", ROUNDED)}
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            {updatePhaseMutation.isPending ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditMode(false)}
                                                            disabled={updatePhaseMutation.isPending}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors", ROUNDED)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditMode(true)}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#091590] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors", ROUNDED)}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirm({ id: activePhase.id, name: activePhase.name })}
                                                            className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors", ROUNDED)}
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
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]", ROUNDED)}
                                                    placeholder="Phase name"
                                                />
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>{activePhase.name}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start date</label>
                                            {isEditMode ? (
                                                <input
                                                    type="date"
                                                    value={editStartDate}
                                                    onChange={(e) => setEditStartDate(e.target.value)}
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]", ROUNDED)}
                                                />
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>
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
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]", ROUNDED)}
                                                />
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>
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
                                                    className={cn("w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] cursor-pointer", ROUNDED)}
                                                >
                                                    <option value="INTERNAL">Internal</option>
                                                    <option value="CLIENT">Client</option>
                                                </select>
                                            ) : (
                                                <div className={cn("px-3 py-2 border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium", ROUNDED)}>{activePhase.access || 'INTERNAL'}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Task lists</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {(activePhase.taskLists || []).length === 0 ? (
                                                    <div className={cn("px-4 py-3 border border-dashed border-gray-200 text-gray-400 text-xs italic bg-gray-50/30", ROUNDED)}>
                                                        No task lists in this phase
                                                    </div>
                                                ) : (
                                                    (activePhase.taskLists || []).map((tl) => (
                                                        <div
                                                            key={tl.id}
                                                            className={cn("group flex items-center justify-between p-3 border border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm", ROUNDED)}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={cn("w-7 h-7 bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors", ROUNDED)}>
                                                                    <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <div className="text-sm font-bold text-gray-700 truncate group-hover:text-emerald-700 transition-colors">{tl.name}</div>
                                                                    <div className="text-[10px] text-gray-400 font-medium">{tl.tasks?.length || 0} task(s)</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
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
                    </motion.div>
                </motion.div>
            )}
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
        </AnimatePresence>
    );
}
