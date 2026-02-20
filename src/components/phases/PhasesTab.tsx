'use client';

import React, { useState, useMemo } from 'react';
import { Layers, ListTodo, Plus, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
import { useStructuredPhases, useDeletePhase } from '@/hooks/use-phases';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import { CreatePhaseModal } from './CreatePhaseModal';

interface PhasesTabProps {
    projectId: string;
    projectName?: string;
    projectColor?: string | null;
    isEditable: boolean;
    searchQuery?: string;
}

function countTasks(tasks: { children?: any[] }[]): number {
    return (tasks || []).reduce((s, t) => s + 1 + countTasks(t.children || []), 0);
}

export default function PhasesTab({
    projectId,
    projectName,
    projectColor,
    isEditable,
    searchQuery = ''
}: PhasesTabProps) {
    const { data: phasesData = [], isLoading, refetch } = useStructuredPhases(projectId);
    const phases = useMemo(() => {
        if (!searchQuery.trim()) return phasesData;
        const q = searchQuery.trim().toLowerCase();
        return phasesData.filter(
            (p) => p.name.toLowerCase().includes(q) ||
                (p.taskLists || []).some((tl) => tl.name.toLowerCase().includes(q))
        );
    }, [phasesData, searchQuery]);
    const deletePhaseMutation = useDeletePhase(projectId);
    const toast = useToast();

    const [createPhaseModalOpen, setCreatePhaseModalOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ phaseId: string; name: string } | null>(null);

    const handleDeletePhase = async () => {
        if (!deleteDialog) return;
        const tid = toast.loading('Deleting phase...');
        try {
            await deletePhaseMutation.mutateAsync(deleteDialog.phaseId);
            toast.success('Phase deleted', undefined, { id: tid });
            setDeleteDialog(null);
        } catch {
            toast.error('Failed to delete phase', undefined, { id: tid });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <Loader size={32} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-4">
                <div className="w-full">
                    <div className="flex justify-end mb-6">
                        {isEditable && (
                            <button
                                onClick={() => setCreatePhaseModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Phase
                            </button>
                        )}
                    </div>

                    {phases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-md border border-dashed border-gray-200">
                            <Layers className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-sm font-medium text-gray-500 mb-1">No phases yet</p>
                            <p className="text-xs text-gray-400 mb-4">Create phases to organize your project work</p>
                            {isEditable && (
                                <button
                                    onClick={() => setCreatePhaseModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Phase
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {phases.map((phase, idx) => {
                                const taskLists = phase.taskLists || [];
                                const totalTasks = taskLists.reduce(
                                    (sum, tl) => sum + countTasks(tl.tasks || []),
                                    0
                                );
                                return (
                                    <div
                                        key={phase.id}
                                        className={cn(
                                            "border rounded-md overflow-hidden transition-colors",
                                            "bg-white border-gray-200 hover:border-indigo-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 p-4">
                                            <div className="w-10 h-10 rounded-md bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Layers className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{phase.name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <ListTodo className="w-3.5 h-3.5" />
                                                        {taskLists.length} task list{taskLists.length !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                                                    </span>
                                                    {(phase.startDate || phase.endDate) && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {phase.startDate
                                                                ? new Date(phase.startDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })
                                                                : '–'}{' '}
                                                            to{' '}
                                                            {phase.endDate
                                                                ? new Date(phase.endDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })
                                                                : '–'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isEditable && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setDeleteDialog({ phaseId: phase.id, name: phase.name })}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete phase"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {taskLists.length > 0 && (
                                            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {taskLists.map((tl) => (
                                                        <div
                                                            key={tl.id}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700"
                                                        >
                                                            <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="font-medium">{tl.name}</span>
                                                            <span className="text-xs text-gray-400">
                                                                {countTasks(tl.tasks || [])} tasks
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <CreatePhaseModal
                isOpen={createPhaseModalOpen}
                onClose={() => setCreatePhaseModalOpen(false)}
                currentProjectId={projectId}
                projectName={projectName}
                projectColor={projectColor}
                onSuccess={() => refetch()}
            />

            <Dialog
                isOpen={!!deleteDialog}
                onClose={() => setDeleteDialog(null)}
                type="warning"
                title="Delete Phase"
                message={`Are you sure you want to delete "${deleteDialog?.name}"?`}
                description="All task lists and tasks in this phase will be permanently deleted."
                confirmText="Delete"
                confirmVariant="destructive"
                onConfirm={handleDeletePhase}
                isLoading={deletePhaseMutation.isPending}
            />

            <ToastContainer />
        </div>
    );
}
