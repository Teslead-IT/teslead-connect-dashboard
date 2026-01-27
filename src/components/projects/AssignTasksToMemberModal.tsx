import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Square, Loader2, ListTodo } from 'lucide-react';
import { ProjectMember } from '@/types/project';
import { useProjectTasks, useUpdateTask } from '@/hooks/use-tasks';
import { Task } from '@/types/task';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { taskService } from '@/services/tasks.service';
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/hooks/use-tasks';

interface AssignTasksToMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: ProjectMember;
    projectId: string;
}

export function AssignTasksToMemberModal({ isOpen, onClose, member, projectId }: AssignTasksToMemberModalProps) {
    const { data: tasks = [], isLoading } = useProjectTasks(projectId);
    const queryClient = useQueryClient();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Track original assignments to determine changes
    const originalAssignments = useMemo(() => {
        const assigned = new Set<string>();
        tasks.forEach(task => {
            if (task.assigneeIds?.includes(member.user.id)) {
                assigned.add(task.id);
            }
        });
        return assigned;
    }, [tasks, member.user.id]);

    // Initialize selection with current assignments when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedTaskIds(new Set(originalAssignments));
            setSearchQuery('');
        }
    }, [isOpen, originalAssignments]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [tasks, searchQuery]);

    const handleToggleTask = (taskId: string) => {
        const newSelected = new Set(selectedTaskIds);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTaskIds(newSelected);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading('Updating assignments...');

        try {
            // 1. Find tasks to ASSIGN (in selected but not in original)
            const toAssign = Array.from(selectedTaskIds).filter(id => !originalAssignments.has(id));

            // 2. Find tasks to UNASSIGN (in original but not in selected)
            const toUnassign = Array.from(originalAssignments).filter(id => !selectedTaskIds.has(id));

            // Use bulk assign API for assignments (more efficient)
            if (toAssign.length > 0) {
                await taskService.bulkAssignUser(toAssign, member.user.id);
            }

            // Process Unassignments individually
            if (toUnassign.length > 0) {
                await Promise.all(
                    toUnassign.map(taskId => taskService.removeAssignee(taskId, member.user.id))
                );
            }

            // Invalidate tasks query to refresh the data
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });

            toast.success(`Updated tasks for ${member.user.name}`, undefined, { id: toastId });
            onClose();
        } catch (error) {
            console.error('Failed to assign tasks:', error);
            toast.error('Failed to update assignments', undefined, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
            // onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out translate-x-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Assign Tasks</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Assign tasks to <span className="font-medium text-gray-900">{member.user.name}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-xs">Loading tasks...</span>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <ListTodo className="w-10 h-10 mb-2 opacity-20" />
                                <span className="text-sm">No tasks found</span>
                            </div>
                        ) : (
                            filteredTasks.map(task => {
                                const isSelected = selectedTaskIds.has(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => handleToggleTask(task.id)}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                                            isSelected ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                                        )}>
                                            {isSelected && <CheckSquare className="w-3 h-3" />}
                                        </div>
                                        {/* Hidden checkbox for accessibility/logic if needed, but the div click handles it. 
                                            Actually, let's keep the visual as is since I wrote custom visual logic:
                                            "bg-blue-600 border-blue-600 text-white" vs "border-gray-300 bg-white"
                                            So I don't strictly need <input> if the onClick is on the parent div.
                                            But the import removal is enough.
                                         */}
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("text-sm font-medium truncate", isSelected ? "text-blue-900" : "text-gray-900")}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded border capitalize",
                                                    task.status.stageName === 'Done' || task.status.stageName === 'Completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                                                )}>
                                                    {task.status.name}
                                                </span>
                                                {task.priority >= 4 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-red-50 text-red-600 border-red-200 font-medium">
                                                        High Priority
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
                    <span className="text-xs text-gray-500">
                        {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[#071170] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[100px]"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
