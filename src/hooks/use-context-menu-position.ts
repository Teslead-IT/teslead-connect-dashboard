'use client';

import { useState, useLayoutEffect, useRef } from 'react';

interface Position {
    x: number;
    y: number;
}

/**
 * Hook to calculate smart context menu position to keep it within viewport
 * @param initialX Mouse click X coordinate
 * @param initialY Mouse click Y coordinate
 * @param padding Padding from viewport edges (default 16px)
 */
export function useContextMenuPosition(initialX: number, initialY: number, padding: number = 16) {
    const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!menuRef.current) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = initialX;
        let adjustedY = initialY;

        // Check right boundary
        if (initialX + menuRect.width > viewportWidth - padding) {
            adjustedX = initialX - menuRect.width;
        }

        // Check bottom boundary
        if (initialY + menuRect.height > viewportHeight - padding) {
            adjustedY = initialY - menuRect.height;
        }

        // Final check to ensure we don't go off the top or left (unlikely for click, but possible)
        if (adjustedX < padding) adjustedX = padding;
        if (adjustedY < padding) adjustedY = padding;

        setPosition({ x: adjustedX, y: adjustedY });
    }, [initialX, initialY, padding]);

    return { position, menuRef };
}
