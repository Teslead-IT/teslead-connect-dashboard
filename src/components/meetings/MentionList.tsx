'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionListProps {
    items: any[];
    command: (item: any) => void;
    type?: 'user' | 'project';
}

export const MentionList = forwardRef<any, MentionListProps>(
    ({ items, command, type = 'user' }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((prev) =>
                        prev <= 0 ? items.length - 1 : prev - 1
                    );
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((prev) =>
                        prev >= items.length - 1 ? 0 : prev + 1
                    );
                    return true;
                }
                if (event.key === 'Enter') {
                    if (items[selectedIndex]) {
                        selectItem(selectedIndex);
                    }
                    return true;
                }
                return false;
            },
        }));

        const selectItem = (index: number) => {
            const item = items[index];
            if (item) {
                command({ id: item.id, label: item.name });
            }
        };

        const typeLabel = type === 'user' ? 'People' : 'Projects';

        if (!items.length) {
            return (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-xl shadow-gray-200/50 p-4 min-w-[260px]">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {typeLabel}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 text-center py-2">No results found</p>
                    <p className="text-[11px] text-gray-400 text-center">Try a different search</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-xl shadow-gray-200/50 overflow-hidden min-w-[260px] max-w-[320px] max-h-[280px] flex flex-col">
                {/* Header */}
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
                    {type === 'user' ? (
                        <User className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                        <FolderKanban className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {typeLabel}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400 font-medium">
                        {items.length} result{items.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* List */}
                <div className="overflow-y-auto py-1 max-h-[240px]">
                    {items.map((item: any, index: number) => {
                        const isSelected = index === selectedIndex;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => selectItem(index)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors outline-none',
                                    isSelected
                                        ? 'bg-blue-50 text-[#091590]'
                                        : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                {type === 'user' ? (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#091590] to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                                            {item.avatarUrl ? (
                                                <img
                                                    src={item.avatarUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                item.name?.charAt(0)?.toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate text-gray-900">
                                                {item.name}
                                            </p>
                                            {item.email && (
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    {item.email}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                                            style={{ backgroundColor: item.color || '#091590' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate text-gray-900">
                                                {item.name}
                                            </p>
                                            {item.projectId && (
                                                <p className="text-[11px] text-gray-500 truncate font-mono">
                                                    {item.projectId}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer hint */}
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[9px]">↑↓</kbd>
                    <span>Navigate</span>
                    <span className="text-gray-300">·</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[9px]">↵</kbd>
                    <span>Select</span>
                </div>
            </div>
        );
    }
);

MentionList.displayName = 'MentionList';
