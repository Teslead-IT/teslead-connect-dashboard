'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    items: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ items, activeTab, onChange, className }: TabsProps) {
    // We can add a sliding underline effect
    const [tabRects, setTabRects] = useState<Record<string, { left: number; width: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Measure tabs for the sliding underline on mount and resize
        const measureTabs = () => {
            if (!containerRef.current) return;
            const newRects: Record<string, { left: number; width: number }> = {};
            const buttons = containerRef.current.querySelectorAll('[role="tab"]');

            buttons.forEach((btn) => {
                const id = btn.getAttribute('data-tab-id');
                const rect = (btn as HTMLElement).getBoundingClientRect();
                const containerRect = containerRef.current!.getBoundingClientRect();

                if (id) {
                    newRects[id] = {
                        left: rect.left - containerRect.left,
                        width: rect.width
                    };
                }
            });
            setTabRects(newRects);
        };

        measureTabs();
        window.addEventListener('resize', measureTabs);
        return () => window.removeEventListener('resize', measureTabs);
    }, [items]);

    const activeRect = tabRects[activeTab];

    return (
        <div
            ref={containerRef}
            className={cn("flex  items-center gap-1 border-b border-gray-200 relative overflow-x-auto no-scrollbar", className)}
        >
            {items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        data-tab-id={item.id}
                        role="tab"
                        onClick={() => onChange(item.id)}
                        className={cn(
                            "relative px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-2 select-none outline-none focus:outline-none",
                            isActive
                                ? "text-[var(--primary)]" // Active color
                                : "text-gray-500 hover:text-gray-700 cursor-pointer"
                        )}
                    >
                        {item.icon && <span className={cn("w-4 h-4", isActive ? "text-[var(--primary)]" : "text-gray-400")}>{item.icon}</span>}
                        {item.label}
                    </button>
                );
            })}

            {/* Sliding Underline Indicator */}
            {activeRect && (
                <motion.div
                    className="absolute bottom-0 h-0.5 bg-[var(--primary)] z-10"
                    initial={false}
                    animate={{
                        left: activeRect.left,
                        width: activeRect.width
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                />
            )}
        </div>
    );
}
