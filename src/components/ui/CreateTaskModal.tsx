import { TaskPriority, CreateTaskPayload, Task, WorkflowStage } from '@/types/task';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskPayload) => Promise<void>;
    workflow: WorkflowStage[];
    parentTask?: Task | null;
    initialData?: Task;
    isReadOnly?: boolean;
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, workflow, parentTask, initialData, isReadOnly = false }: CreateTaskModalProps) {
    const [formData, setFormData] = useState<CreateTaskPayload>({
        title: '',
        description: '',
        priority: 3,
        statusId: workflow[0]?.statuses.find(s => s.isDefault)?.id || workflow[0]?.statuses[0]?.id || '',
        dueDate: '',
        assigneeIds: [],
        parentId: parentTask?.id || null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allStatuses = workflow.flatMap(stage =>
        stage.statuses.map(status => ({ ...status, stageName: stage.name }))
    );

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    description: initialData.description || '',
                    priority: initialData.priority,
                    statusId: initialData.status.id,
                    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
                    assigneeIds: initialData.assigneeIds || initialData.assignees?.map(a => a.id || a.userId) || [],
                    parentId: initialData.parentId,
                });
            } else {
                // Reset for new task
                setFormData({
                    title: '',
                    description: '',
                    priority: 3,
                    statusId: workflow[0]?.statuses.find(s => s.isDefault)?.id || workflow[0]?.statuses[0]?.id || '',
                    dueDate: '',
                    assigneeIds: [],
                    parentId: parentTask?.id || null,
                });
            }
            setError(null);
        }
    }, [isOpen, initialData, parentTask, workflow]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(formData);
            // onClose(); // Let parent handle closing if needed, or close here. page.tsx closes it.
        } catch (err) {
            setError('Failed to save task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
            // onClick={onClose}
            />
            <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out translate-x-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isReadOnly ? 'Task Details' : (initialData ? 'Edit Task' : (parentTask ? `Add Subtask to "${parentTask.title}"` : 'Create New Task'))}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="Enter task title"
                                autoFocus={!isReadOnly}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="Enter task description"
                                disabled={isReadOnly}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.statusId}
                                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={isReadOnly}
                            >
                                {allStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.stageName} - {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) as TaskPriority })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    disabled={isReadOnly}
                                >
                                    <option value={1}>Lowest</option>
                                    <option value={2}>Low</option>
                                    <option value={3}>Medium</option>
                                    <option value={4}>High</option>
                                    <option value={5}>Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}
                    </form>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.title.trim()}
                            className="px-6 py-2 cursor-pointer text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[100px]"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                initialData ? 'Save Changes' : (parentTask ? 'Add Subtask' : 'Create Task')
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
