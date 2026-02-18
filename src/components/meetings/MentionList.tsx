'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

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
                // Pass id and label explicitly so Tiptap renders the name
                command({ id: item.id, label: item.name });
            }
        };

        if (!items.length) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3 min-w-[200px]">
                    <p className="text-xs text-gray-400 text-center">No results found</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden min-w-[220px] max-h-[240px] overflow-y-auto">
                {items.map((item: any, index: number) => (
                    <button
                        key={item.id}
                        onClick={() => selectItem(index)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors text-sm ${index === selectedIndex
                            ? 'bg-[#091590]/10 text-[#091590]'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {type === 'user' ? (
                            <>
                                <div className="w-7 h-7 rounded-full bg-[#091590] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
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
                                    <p className="text-sm font-semibold truncate">{item.name}</p>
                                    {item.email && (
                                        <p className="text-[10px] text-gray-400 truncate">{item.email}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color || '#091590' }}
                                />
                                <span className="font-semibold truncate">{item.name}</span>
                            </>
                        )}
                    </button>
                ))}
            </div>
        );
    }
);

MentionList.displayName = 'MentionList';
