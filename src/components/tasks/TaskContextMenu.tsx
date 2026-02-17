/**
 * Task Context Menu Component
 * Allows right-click actions on task items
 */

'use client';

import React from 'react';
import { Pencil, Trash2, Plus, Eye, UserPlus, UserMinus } from 'lucide-react';
import { useContextMenuPosition } from '@/hooks/use-context-menu-position';

interface TaskContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onCreateSubtask?: () => void;
    onViewDetails?: () => void;
    onAssignUsers?: () => void;
    onRevokeAssignee?: () => void;
}

export function TaskContextMenu({
    x,
    y,
    onClose,
    onEdit,
    onDelete,
    onCreateSubtask,
    onViewDetails,
    onAssignUsers,
    onRevokeAssignee,
}: TaskContextMenuProps) {
    const { position, menuRef } = useContextMenuPosition(x, y);

    return (
        <>
            <div
                ref={menuRef}
                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[200px]"
                style={{ top: position.y, left: position.x }}
                onClick={(e) => e.stopPropagation()}
            >
                {onViewDetails && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onViewDetails();
                            onClose();
                        }}
                    >
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span>View Details</span>
                    </button>
                )}
                {onCreateSubtask && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onCreateSubtask();
                            onClose();
                        }}
                    >
                        <Plus className="w-4 h-4 text-[#091590]" />
                        <span>Add Subtask</span>
                    </button>
                )}

                {onAssignUsers && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onAssignUsers();
                            onClose();
                        }}
                    >
                        <UserPlus className="w-4 h-4 text-green-600" />
                        <span>Assign Users</span>
                    </button>
                )}

                {onRevokeAssignee && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onRevokeAssignee();
                            onClose();
                        }}
                    >
                        <UserMinus className="w-4 h-4 text-orange-600" />
                        <span>Revoke Assignee</span>
                    </button>
                )}

                {onEdit && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                    >
                        <Pencil className="w-4 h-4 text-gray-500" />
                        <span>Edit Task</span>
                    </button>
                )}

                {onDelete && (
                    <>
                        <div className="h-px bg-gray-100 my-1"></div>

                        <button
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2.5 text-red-600 transition-colors"
                            onClick={() => {
                                onDelete();
                                onClose();
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Task</span>
                        </button>
                    </>
                )}
            </div>

            {/* Transparent overlay to close menu when clicking outside */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
        </>
    );
}
