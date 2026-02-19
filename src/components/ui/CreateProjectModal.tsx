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
    Building2,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ColorPicker } from 'primereact/colorpicker';

export interface TagData {
    name: string;
    color: string;
}

export interface ProjectFormData {
    name: string;
    description: string;
    color: string;
    startDate: string;
    endDate: string;
    access: 'PRIVATE' | 'PUBLIC';
    status: ProjectStatus;
    tags?: TagData[];
    orgId?: string;
}

export interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: ProjectFormData) => void | Promise<void>;
    defaultOrgId?: string;
    initialData?: ProjectFormData;
}


export function CreateProjectModal({ isOpen, onClose, onSubmit, defaultOrgId, initialData }: CreateProjectModalProps) {
    const [formData, setFormData] = useState<ProjectFormData>({
        name: '',
        description: '',
        color: '#3B82F6',
        startDate: '',
        endDate: '',
        access: 'PRIVATE',
        status: 'NOT_STARTED',
        tags: [],
        orgId: '',
    });

    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tag state
    const [tagInput, setTagInput] = useState('');
    const [tagColor, setTagColor] = useState('#10B981'); // Default green for tags

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal closes or opens with new data
    useEffect(() => {
        if (!isOpen) {
            // Reset logic when closing...
            setFormData({
                name: '',
                description: '',
                color: '#3B82F6',
                startDate: '',
                endDate: '',
                access: 'PRIVATE',
                status: 'NOT_STARTED',
                tags: [],
                orgId: defaultOrgId && defaultOrgId !== 'all' ? defaultOrgId : (user?.currentOrgId || ''),
            });
            setErrors({});
            setTagInput('');
            setTagColor('#10B981');
        } else if (initialData) {
            // Populate form with initial data for editing
            setFormData({
                ...initialData,
                // Ensure dates are in YYYY-MM-DD format for input[type="date"]
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            // Default logic for new project...
            if ((!formData.orgId || formData.orgId === 'all') && user?.currentOrgId) {
                const targetOrg = (defaultOrgId && defaultOrgId !== 'all') ? defaultOrgId : user.currentOrgId;
                setFormData(prev => ({ ...prev, orgId: targetOrg }));
            }
        }
    }, [isOpen, initialData, user?.currentOrgId, defaultOrgId]);

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
        if (tagInput.trim() && !formData.tags?.some(t => t.name === tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), { name: tagInput.trim(), color: tagColor }],
            });
            setTagInput('');
            // Optional: Randomize next tag color or keep same
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter(tag => tag.name !== tagToRemove) || [],
        });
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

                        {/* Organization Selector */}
                        {user?.memberships && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                </div>
                                <select
                                    value={formData.orgId}
                                    onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg py-1.5 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[200px] hover:border-gray-300 transition-all shadow-sm"
                                >
                                    {user.memberships
                                        .filter(m => (m.role === 'OWNER' || m.role === 'ADMIN') && m.status === 'ACTIVE')
                                        .map((m) => (
                                            <option key={m.orgId} value={m.orgId}>
                                                {m.orgName}
                                            </option>
                                        ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                            </div>
                        )}
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

                        {/* Project Title & Color */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
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
                                            "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm",
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                    />
                                    {/* <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
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
                                            "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm",
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                            >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        {/* Description with Rich Text Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
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
                                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-white"
                                    placeholder="Enter project description..."
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
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
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                        placeholder="Add a tag..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
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
                                                    onClick={() => handleRemoveTag(tag.name)}
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
                            <label className="block text-sm font-medium text-gray-700 mb-3">Project Access</label>
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
                                        <span className="text-sm font-semibold text-gray-900 block">Private</span>
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
                                        <span className="text-sm font-semibold text-gray-900 block">Public</span>
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
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.name.trim()}
                        className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
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
