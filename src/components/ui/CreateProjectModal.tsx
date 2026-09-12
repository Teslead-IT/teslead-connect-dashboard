'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types/project';
import {
    X,
    Calendar,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image as ImageIcon,
    Paperclip,
    Smile,
    Lock,
    Globe,
    Palette,
    ChevronDown,
    Check,
    Layers,
    ListTree,
    FolderKanban,
    Sparkles,
} from 'lucide-react';
import { ColorPicker } from 'primereact/colorpicker';
import { Dropdown } from '@/components/ui/Dropdown';

export interface TagData {
    id?: string;
    name: string;
    color: string;
}

export interface TemplatePhase {
    name: string;
    taskLists: string[];
}

export interface ProjectTemplate {
    id: string;
    title: string;
    description: string;
    badgeColor: string;
    phases: TemplatePhase[];
}

export const PREDEFINED_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'internal',
        title: 'Internal Software Development',
        description: '7 standard SDLC phases with complete task list breakdown.',
        badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
        phases: [
            {
                name: 'PLANNING',
                taskLists: ['REQUIREMENTS', 'PROJECT PLANNING'],
            },
            {
                name: 'DESIGN',
                taskLists: ['UI DESIGN', 'TECHNICAL DESIGN'],
            },
            {
                name: 'FRONTEND DEVELOPMENT',
                taskLists: [
                    'API INTEGRATION',
                    'PAGE DESIGNING / STRUCTURING',
                    'FILE STRUCTURE',
                    'PROJECT SETUP',
                    'COMPONENT DEVELOPMENT',
                    'FORM & VALIDATION',
                    'RESPONSIVE DESIGN',
                    'FINAL REVIEW',
                ],
            },
            {
                name: 'BACKEND DEVELOPMENT',
                taskLists: [
                    'PROJECT SETUP',
                    'DATABASE',
                    'AUTHENTICATION & AUTHORIZATION',
                    'API DEVELOPMENT',
                    'BUSINESS LOGIC',
                    'THIRD-PARTY INTEGRATION',
                    'DEPLOYMENT AND CONFIG',
                ],
            },
            {
                name: 'TESTING',
                taskLists: [
                    'TEST PLANNING',
                    'FUNCTIONAL TESTING',
                    'UI TESTING',
                    'API TESTING',
                    'INTEGRATION TESTING',
                    'REGRESSION TESTING',
                    'BUG FIXING & RETESTING',
                    'FINAL TESTING',
                ],
            },
            {
                name: 'DEPLOYMENT',
                taskLists: ['DEPLOYMENT PREPARATION', 'PRODUCTION DEPLOYMENT', 'PRODUCTION VERIFICATION'],
            },
            {
                name: 'MAINTENANCE',
                taskLists: ['SUPPORT', 'ENHANCEMENTS'],
            },
        ],
    },
    {
        id: 'datalogger',
        title: 'Datalogger Project',
        description: 'Module-focused structure (Frontend, Backend, Testing, Deployment, Design, Manual).',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        phases: [
            {
                name: 'FRONTEND',
                taskLists: ['LOGIN', 'SIDEBAR', 'DASHBOARD', 'FORM PAGE', 'LIVE PAGE', 'REPORT'],
            },
            {
                name: 'BACKEND',
                taskLists: ['LOGIN', 'SIDEBAR', 'DASHBOARD', 'FORM PAGE', 'LIVE PAGE', 'REPORT'],
            },
            {
                name: 'TESTING',
                taskLists: ['LOGIN', 'SIDEBAR', 'DASHBOARD', 'FORM PAGE', 'LIVE PAGE', 'REPORT'],
            },
            {
                name: 'DEPLOYMENT',
                taskLists: ['PRE-DEPLOYMENT', 'DEPLOYMENT', 'POST-DEPLOYMENT'],
            },
            {
                name: 'DESIGN',
                taskLists: ['UI/UX', 'SCHEMATICS', 'ARCHITECTURE'],
            },
            {
                name: 'MANUAL',
                taskLists: ['USER MANUAL', 'TECHNICAL DOCS'],
            },
        ],
    },
    {
        id: 'blank',
        title: 'Blank Project',
        description: 'Start fresh without any pre-configured phases or task lists.',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
        phases: [],
    },
];

export interface ProjectFormData {
    name: string;
    description: string;
    color: string;
    startDate: string;
    endDate: string;
    access: 'PRIVATE' | 'PUBLIC';
    status: ProjectStatus;
    tags?: TagData[];
    phases?: TemplatePhase[];
    orgId?: string;
}

export interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: ProjectFormData) => void | Promise<void>;
    initialData?: ProjectFormData;
}

const PROJECT_STATUS_OPTIONS = [
    { value: 'NOT_STARTED', label: 'Not Started', dotColor: '#94a3b8' },
    { value: 'PLANNING', label: 'Planning', dotColor: '#0ea5e9' },
    { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#3b82f6' },
    { value: 'ON_HOLD', label: 'On Hold', dotColor: '#f59e0b' },
    { value: 'REVIEW', label: 'Review', dotColor: '#6366f1' },
    { value: 'TESTING', label: 'Testing', dotColor: '#a855f7' },
    { value: 'COMPLETED', label: 'Completed', dotColor: '#10b981' },
    { value: 'CANCELLED', label: 'Cancelled', dotColor: '#f43f5e' },
    { value: 'BLOCKED', label: 'Blocked', dotColor: '#ef4444' },
    { value: 'ARCHIVED', label: 'Archived', dotColor: '#475569' },
];

export function CreateProjectModal({ isOpen, onClose, onSubmit, initialData }: CreateProjectModalProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('internal');
    const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(true);

    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        color: '#3B82F6',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        access: 'PRIVATE',
        status: 'NOT_STARTED',
        tags: [],
        phases: PREDEFINED_TEMPLATES[0].phases,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tagColor, setTagColor] = useState('#10B981');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Handle template selection
    const handleSelectTemplate = (template: ProjectTemplate) => {
        setSelectedTemplateId(template.id);
        setFormData(prev => ({
            ...prev,
            phases: template.phases,
        }));
    };

    useEffect(() => {
        if (!isOpen) {
            setSelectedTemplateId('internal');
            setFormData({
                name: '',
                description: '',
                color: '#3B82F6',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                access: 'PRIVATE',
                status: 'NOT_STARTED',
                tags: [],
                phases: PREDEFINED_TEMPLATES[0].phases,
            });
            setErrors({});
            setTagInput('');
            setTagColor('#10B981');
        } else if (initialData) {
            setFormData({
                ...initialData,
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
            });
        }
    }, [isOpen, initialData]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Project title is required';
        }

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !formData.tags?.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), { name: trimmed, color: tagColor }],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag.name.toLowerCase() !== tagToRemove.toLowerCase()) || [],
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Modal Panel */}
            <div
                className={cn(
                    "relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Project' : 'New Project'}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Project Template Selection */}
                        {!initialData && (
                            <div className="space-y-3 bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-[#091590] text-white flex items-center justify-center shadow-2xs">
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Project Template</h3>
                                            <p className="text-[11px] text-gray-500">Choose a pre-built structure to auto-generate phases & task lists</p>
                                        </div>
                                    </div>
                                    {formData.phases && formData.phases.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                                            className="text-[11px] font-bold text-[#091590] hover:underline flex items-center gap-1"
                                        >
                                            <span>{showTemplatePreview ? 'Hide Preview' : 'Show Preview'}</span>
                                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showTemplatePreview && "rotate-180")} />
                                        </button>
                                    )}
                                </div>

                                {/* Template Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                    {PREDEFINED_TEMPLATES.map((tmpl) => {
                                        const isSelected = selectedTemplateId === tmpl.id;
                                        const totalTaskLists = tmpl.phases.reduce((acc, p) => acc + p.taskLists.length, 0);

                                        return (
                                            <div
                                                key={tmpl.id}
                                                onClick={() => handleSelectTemplate(tmpl)}
                                                className={cn(
                                                    "relative p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between group",
                                                    isSelected
                                                        ? "bg-white border-[#091590] shadow-md ring-2 ring-[#091590]/10"
                                                        : "bg-white/80 border-gray-200 hover:border-blue-300 hover:bg-white"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="font-bold text-xs text-gray-900 truncate">{tmpl.title}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 line-clamp-2">{tmpl.description}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                                        isSelected ? "bg-[#091590] text-white" : "border border-gray-300 group-hover:border-blue-400"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-[10px]">
                                                    {tmpl.phases.length > 0 ? (
                                                        <>
                                                            <span className="inline-flex items-center gap-1 font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                                                                <Layers className="w-3 h-3" />
                                                                {tmpl.phases.length} Phases
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                                <ListTree className="w-3 h-3" />
                                                                {totalTaskLists} Task Lists
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            Blank / Custom
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Template Structure Preview */}
                                {showTemplatePreview && formData.phases && formData.phases.length > 0 && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-2xs space-y-2 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 border-b border-gray-100 pb-1.5">
                                            <span className="flex items-center gap-1 text-[#091590]">
                                                <Layers className="w-3.5 h-3.5" />
                                                Pre-configured Structure Preview:
                                            </span>
                                        </div>

                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {formData.phases.map((p, idx) => (
                                                <div key={idx} className="space-y-1">
                                                    {/* Phase (Violet Badge) */}
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                                                            <Layers className="w-3 h-3" />
                                                            {p.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">({p.taskLists.length} task lists)</span>
                                                    </div>

                                                    {/* Task Lists (Green Badges) */}
                                                    <div className="flex flex-wrap gap-1 pl-3 border-l-2 border-violet-200 ml-2 py-0.5">
                                                        {p.taskLists.map((tl, tlIdx) => (
                                                            <span
                                                                key={tlIdx}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]"
                                                            >
                                                                <ListTree className="w-2.5 h-2.5 text-emerald-600" />
                                                                {tl}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Project Title & Color */}
                        <div>
                            <label className="flex items-center text-xs font-medium text-gray-700 mb-2">
                                Project Title
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="flex gap-3 items-center">
                                <div className="custom-primereact-colorpicker">
                                    <ColorPicker
                                        value={formData.color.replace('#', '')}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: '#' + e.value }))}
                                    />
                                </div>

                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
                                            errors.name ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300"
                                        )}
                                        placeholder="Enter project title"
                                        autoFocus
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Start Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                    />
                                    {/* <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">End Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => {
                                            setFormData({ ...formData, endDate: e.target.value });
                                            if (errors.endDate) setErrors({ ...errors, endDate: '' });
                                        }}
                                        min={formData.startDate}
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm",
                                            errors.endDate ? "border-red-300" : "border-gray-300"
                                        )}
                                    />
                                    {/* <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
                                </div>
                                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                            <Dropdown
                                value={formData.status}
                                onChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                                options={PROJECT_STATUS_OPTIONS.map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                    icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.dotColor }} />
                                }))}
                                size="md"
                            />
                        </div>

                        {/* Description with Rich Text Editor */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Description</label>
                            <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                {/* Toolbar */}
                                <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Bold">
                                        <Bold className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Italic">
                                        <Italic className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Underline">
                                        <Underline className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-300 mx-1" />
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Bulleted List">
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Numbered List">
                                        <ListOrdered className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-300 mx-1" />
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Align Left">
                                        <AlignLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Align Center">
                                        <AlignCenter className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Align Right">
                                        <AlignRight className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-300 mx-1" />
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Add Image">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Attach File">
                                        <Paperclip className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Add Emoji">
                                        <Smile className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {/* Text Area */}
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 text-xs focus:outline-none resize-none bg-white"
                                    placeholder="Enter project description..."
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="custom-primereact-colorpicker">
                                        <ColorPicker
                                            value={tagColor.replace('#', '')}
                                            onChange={(e) => setTagColor('#' + e.value)}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddTag();
                                            }
                                        }}
                                        placeholder="Add a tag..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-4 py-2 bg-gray-50 text-gray-700 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                {tag.name}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRemoveTag(tag.name);
                                                    }}
                                                    className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Access */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-3">Project Access</label>
                            <div className="space-y-2">
                                <label className={cn(
                                    "flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all hover:shadow-sm",
                                    formData.access === 'PRIVATE' ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                                )}>
                                    <input
                                        type="radio"
                                        name="access"
                                        value="PRIVATE"
                                        checked={formData.access === 'PRIVATE'}
                                        onChange={(e) => setFormData({ ...formData, access: e.target.value as 'PRIVATE' | 'PUBLIC' })}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className={cn("p-1.5 rounded", formData.access === 'PRIVATE' ? "bg-blue-100/50" : "bg-gray-100")}>
                                        <Lock className={cn("w-4 h-4", formData.access === 'PRIVATE' ? "text-blue-600" : "text-gray-500")} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-900 block">Private</span>
                                        <span className="text-xs text-gray-500 block">Only project members can access</span>
                                    </div>
                                </label>
                                <label className={cn(
                                    "flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all hover:shadow-sm",
                                    formData.access === 'PUBLIC' ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                                )}>
                                    <input
                                        type="radio"
                                        name="access"
                                        value="PUBLIC"
                                        checked={formData.access === 'PUBLIC'}
                                        onChange={(e) => setFormData({ ...formData, access: e.target.value as 'PRIVATE' | 'PUBLIC' })}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className={cn("p-1.5 rounded", formData.access === 'PUBLIC' ? "bg-blue-100/50" : "bg-gray-100")}>
                                        <Globe className={cn("w-4 h-4", formData.access === 'PUBLIC' ? "text-blue-600" : "text-gray-500")} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-900 block">Public</span>
                                        <span className="text-xs text-gray-500 block">Visible to everyone in the organization</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.name.trim()}
                        className="px-6 py-2 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {initialData ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            initialData ? 'Update Project' : 'Create Project'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
