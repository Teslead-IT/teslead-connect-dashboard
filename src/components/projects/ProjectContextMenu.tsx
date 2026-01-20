/**
 * Project Context Menu Component
 * Allows right-click actions on project items
 */

'use client';

import React from 'react';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';

interface ProjectContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onInvite?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ProjectContextMenu({
    x,
    y,
    onClose,
    onInvite,
    onEdit,
    onDelete,
}: ProjectContextMenuProps) {
    return (
        <>
            <div
                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[200px]"
                style={{ top: y, left: x }}
                onClick={(e) => e.stopPropagation()}
            >
                {onInvite && (
                    <button
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        onClick={() => {
                            onInvite();
                            onClose();
                        }}
                    >
                        <UserPlus className="w-4 h-4 text-[#091590]" />
                        <span>Add Member / Collaborate</span>
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
                        <span>Edit Project</span>
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
                            <span>Delete Project</span>
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
