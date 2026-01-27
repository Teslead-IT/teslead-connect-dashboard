'use client';

import React, { useState, useMemo } from 'react';
import { X, UserMinus, Loader2, Trash2 } from 'lucide-react';
import { useProjectTasks } from '@/hooks/use-tasks';
import { taskService } from '@/services/tasks.service';
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/hooks/use-tasks';
import { useToast } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

interface RevokeAssigneeModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
    projectId: string;
}

export function RevokeAssigneeModal({ isOpen, onClose, taskId, projectId }: RevokeAssigneeModalProps) {
    const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(projectId);
    const queryClient = useQueryClient();
    const toast = useToast();

    // Find the latest task data from the list to keep it reactive
    const task = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId]);

    const [isRevoking, setIsRevoking] = useState(false);
    const [confirmRevoke, setConfirmRevoke] = useState<{ userId: string; userName: string } | null>(null);

    // Use current assignees directly from the task object
    const currentAssignees = task?.assignees || [];

    const handleRevoke = async (userId: string) => {
        if (!task) return;

        setIsRevoking(true);
        const toastId = toast.loading('Revoking assignment...');

        try {
            await taskService.removeAssignee(task.id, userId);

            // Invalidate tasks query to refresh the data
            queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });

            toast.success('Assignment revoked successfully', undefined, { id: toastId });
            setConfirmRevoke(null);
        } catch (error) {
            console.error('Failed to revoke assignment:', error);
            toast.error('Failed to revoke assignment', undefined, { id: toastId });
        } finally {
            setIsRevoking(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    // onClick={onClose}
                />

                <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <UserMinus className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-none">Revoke Assignees</h2>
                                <p className="text-xs text-gray-500 mt-1 truncate max-w-[240px]" title={task.title}>Task: {task.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 cursor-pointer rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-0 flex-1 overflow-hidden flex flex-col min-h-[300px] max-h-[60vh]">
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Currently Assigned</span>
                            <span>{currentAssignees.length} Members</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {tasksLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#091590]" />
                                    <span className="text-sm font-medium tracking-tight">Syncing members...</span>
                                </div>
                            ) : currentAssignees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <UserMinus className="w-8 h-8 opacity-20" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold">No active assignments</h3>
                                    <p className="text-sm text-gray-500 mt-1 px-10">There are no users currently assigned to this task.</p>
                                </div>
                            ) : (
                                currentAssignees.map((assignee, index) => {
                                    const userName = assignee.user?.name || assignee.name || 'Unknown User';
                                    const userEmail = assignee.user?.email || assignee.email || '';
                                    const userId = assignee.user?.id || assignee.userId || assignee.id || `unknown-${index}`;
                                    const initial = userName.charAt(0).toUpperCase();

                                    return (
                                        <div
                                            key={userId}
                                            className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0 border border-slate-200 shadow-sm overflow-hidden">
                                                {assignee.user?.avatarUrl ? (
                                                    <img src={assignee.user.avatarUrl} alt={userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    initial
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {userName}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">{userEmail}</p>
                                            </div>

                                            <button
                                                onClick={() => setConfirmRevoke({ userId, userName })}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95 group/btn"
                                                title="Revoke Assignment"
                                            >
                                                <Trash2 className="w-4 h-4 transition-transform cursor-pointer group-hover/btn:scale-110" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-gray-700 bg-white cursor-pointer border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                isOpen={!!confirmRevoke}
                onClose={() => setConfirmRevoke(null)}
                type="warning"
                title="Revoke Assignment"
                message={`Are you sure you want to remove ${confirmRevoke?.userName} from this task?`}
                description="They will no longer be responsible for its completion."
                confirmText="Revoke Now"
                cancelText="Keep Assignment"
                confirmVariant="destructive"
                onConfirm={confirmRevoke ? () => handleRevoke(confirmRevoke.userId) : undefined}
                isLoading={isRevoking}
            />
        </>
    );
}
