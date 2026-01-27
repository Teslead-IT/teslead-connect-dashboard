import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Loader2, Users } from 'lucide-react';
import { Task } from '@/types/task';
import { useProjectMembers } from '@/hooks/use-projects';
import { taskService } from '@/services/tasks.service';
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/hooks/use-tasks';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface AssignUsersToTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    projectId: string;
}

export function AssignUsersToTaskModal({ isOpen, onClose, task, projectId }: AssignUsersToTaskModalProps) {
    const { data: members = [], isLoading } = useProjectMembers(projectId);
    const queryClient = useQueryClient();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Track original assignments to determine changes
    const originalAssignments = useMemo(() => {
        const assigned = new Set<string>();
        const assigneeIds = task.assigneeIds || [];
        assigneeIds.forEach(id => assigned.add(id));
        return assigned;
    }, [task.assigneeIds]);

    // Initialize selection with current assignments when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedUserIds(new Set(originalAssignments));
            setSearchQuery('');
        }
    }, [isOpen, originalAssignments]);

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [members, searchQuery]);

    const handleToggleUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUserIds(newSelected);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading('Updating assignees...');

        try {
            const promises: Promise<any>[] = [];

            // 1. Find users to ASSIGN (in selected but not in original)
            const toAssign = Array.from(selectedUserIds).filter(id => !originalAssignments.has(id));

            // 2. Find users to UNASSIGN (in original but not in selected)
            const toUnassign = Array.from(originalAssignments).filter(id => !selectedUserIds.has(id));

            // Process Assignments
            for (const userId of toAssign) {
                promises.push(taskService.assignUserToTask(task.id, userId));
            }

            // Process Unassignments
            for (const userId of toUnassign) {
                promises.push(taskService.removeAssignee(task.id, userId));
            }

            await Promise.all(promises);

            // Invalidate tasks query to refresh the data
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });

            toast.success(`Updated assignees for "${task.title}"`, undefined, { id: toastId });
            onClose();
        } catch (error) {
            console.error('Failed to assign users:', error);
            toast.error('Failed to update assignees', undefined, { id: toastId });
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
                        <h2 className="text-lg font-semibold text-gray-900">Assign Users</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Assign members to <span className="font-medium text-gray-900 truncate max-w-[200px] inline-block" title={task.title}>{task.title}</span></p>
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
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-xs">Loading members...</span>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Users className="w-10 h-10 mb-2 opacity-20" />
                                <span className="text-sm">No members found</span>
                            </div>
                        ) : (
                            filteredMembers.map(member => {
                                const isSelected = selectedUserIds.has(member.user.id);
                                const initial = member.user.name.charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={member.user.id}
                                        onClick={() => handleToggleUser(member.user.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                                            isSelected ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                                        )}>
                                            {isSelected && <CheckSquare className="w-3 h-3" />}
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0 border border-slate-200">
                                            {member.user.avatarUrl ? (
                                                <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                initial
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className={cn("text-sm font-medium truncate", isSelected ? "text-blue-900" : "text-gray-900")}>
                                                {member.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                                        </div>

                                        <div className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium",
                                            member.role === 'OWNER' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                member.role === 'ADMIN' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                                    member.role === 'MEMBER' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                        "bg-gray-50 text-gray-700 border-gray-200"
                                        )}>
                                            {member.role}
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
                        {selectedUserIds.size} member{selectedUserIds.size !== 1 ? 's' : ''} selected
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
