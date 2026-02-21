'use client';

import React, { useState, useEffect } from 'react';
import { X, ListTodo, Layers, Lock, AlertCircle, Search, Check, Globe, ChevronDown } from 'lucide-react';
import { useCreateTaskList } from '@/hooks/use-phases';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface CreateTaskListModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    phaseId: string;
    phaseName?: string;
    projectName?: string;
    projectColor?: string | null;
    phases?: any[];
    onSuccess?: () => void;
}

export function CreateTaskListModal({
    isOpen,
    onClose,
    projectId,
    phaseId: initialPhaseId,
    phaseName: initialPhaseName,
    projectName,
    projectColor,
    phases = [],
    onSuccess,
}: CreateTaskListModalProps) {
    const toast = useToast();
    const [name, setName] = useState('');
    const [selectedPhaseId, setSelectedPhaseId] = useState(initialPhaseId);
    const [access, setAccess] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [submitted, setSubmitted] = useState(false);
    const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
    const [phaseSearch, setPhaseSearch] = useState('');

    const createTaskListMutation = useCreateTaskList(projectId);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setSelectedPhaseId(initialPhaseId);
            setAccess('PRIVATE');
            setSubmitted(false);
            setPhaseSearch('');
            setShowPhaseDropdown(false);
        }
    }, [isOpen, initialPhaseId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitted(true);

        if (!name.trim() || !selectedPhaseId) {
            return;
        }

        const tid = toast.loading('Creating task list...');
        try {
            await createTaskListMutation.mutateAsync({
                projectId,
                phaseId: selectedPhaseId,
                name: name.trim(),
                access,
            });
            toast.success('Task list created', undefined, { id: tid });
            onSuccess?.();
            onClose();
        } catch {
            toast.error('Failed to create task list', undefined, { id: tid });
        }
    };

    const filteredPhases = React.useMemo(() => {
        if (!phaseSearch.trim()) return phases;
        return phases.filter(p => p.name.toLowerCase().includes(phaseSearch.toLowerCase()));
    }, [phases, phaseSearch]);

    const selectedPhase = phases.find(p => p.id === selectedPhaseId) || { name: initialPhaseName };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <ListTodo className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-base font-bold text-gray-900 leading-tight">New Task List</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Create a new list to group tasks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {projectName && (
                            <span
                                className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-tight shadow-sm transition-all"
                                style={{
                                    backgroundColor: projectColor ? `${projectColor}15` : '#f3f4f6',
                                    color: projectColor || '#6b7280',
                                    borderColor: projectColor ? `${projectColor}30` : '#e5e7eb'
                                }}
                            >
                                {projectName}
                            </span>
                        )}
                        <button onClick={onClose} className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Phase selection */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Phase <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => phases.length > 0 && setShowPhaseDropdown(!showPhaseDropdown)}
                                    className={cn(
                                        "w-full px-4 py-3 bg-white border rounded-md text-sm text-left font-medium text-gray-700 flex items-center justify-between hover:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm group",
                                        submitted && !selectedPhaseId ? "border-red-500" : "border-gray-200"
                                    )}
                                >
                                    <span className="truncate">
                                        {selectedPhase?.name || "Select Phase"}
                                    </span>
                                    {phases.length > 0 && (
                                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", showPhaseDropdown && "rotate-180")} />
                                    )}
                                </button>

                                {showPhaseDropdown && phases.length > 0 && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowPhaseDropdown(false)} />
                                        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search phases..."
                                                        value={phaseSearch}
                                                        onChange={(e) => setPhaseSearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredPhases.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-gray-400 italic">No phases found</div>
                                                ) : (
                                                    filteredPhases.map((phase) => (
                                                        <button
                                                            key={phase.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPhaseId(phase.id);
                                                                setShowPhaseDropdown(false);
                                                                setPhaseSearch('');
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between group",
                                                                selectedPhaseId === phase.id ? "bg-indigo-50/50 text-indigo-700 font-bold" : "text-gray-600"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Layers className={cn("w-3.5 h-3.5", selectedPhaseId === phase.id ? "text-indigo-500" : "text-gray-300")} />
                                                                <span className="truncate">{phase.name}</span>
                                                            </div>
                                                            {selectedPhaseId === phase.id && <Check className="w-4 h-4 text-indigo-600" />}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Name Selection */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ListTodo className="w-3.5 h-3.5 text-emerald-500" /> Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="e.g. Backend, Frontend, QA..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && name.trim() && selectedPhaseId) handleSubmit();
                                }}
                                className={cn(
                                    "w-full text-sm px-4 py-3 bg-white border rounded-md focus:outline-none focus:ring-4 transition-all shadow-sm placeholder:text-gray-300",
                                    submitted && !name.trim()
                                        ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                                        : "border-gray-200 focus:ring-emerald-500/10 focus:border-emerald-500/50"
                                )}
                            />
                        </div>

                        {/* Access Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Access Level</label>
                            <div className="grid grid-cols-1 gap-3">
                                <div
                                    onClick={() => setAccess('PRIVATE')}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 group",
                                        access === 'PRIVATE'
                                            ? "border-emerald-600 bg-emerald-50/30 ring-4 ring-emerald-500/5 shadow-md"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-md flex items-center justify-center transition-all duration-300 shadow-sm",
                                        access === 'PRIVATE' ? "bg-emerald-600 text-white scale-105" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                    )}>
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-sm font-bold block", access === 'PRIVATE' ? "text-emerald-900" : "text-gray-700")}>Private List</span>
                                            {access === 'PRIVATE' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-medium">Only project team members can access this list</span>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setAccess('PUBLIC')}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 group",
                                        access === 'PUBLIC'
                                            ? "border-emerald-600 bg-emerald-50/30 ring-4 ring-emerald-500/5 shadow-md"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-md flex items-center justify-center transition-all duration-300 shadow-sm",
                                        access === 'PUBLIC' ? "bg-emerald-600 text-white scale-105" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                    )}>
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-sm font-bold block", access === 'PUBLIC' ? "text-emerald-900" : "text-gray-700")}>Public List</span>
                                            {access === 'PUBLIC' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-medium">This list will be visible to everyone with project access</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={createTaskListMutation.isPending || !name.trim() || !selectedPhaseId}
                        className="px-8 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                    >
                        {createTaskListMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Create List'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
