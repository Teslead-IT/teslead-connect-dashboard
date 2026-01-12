'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { getUserById } from '@/mock/users';
import type { TaskStatus, TaskPriority } from '@/mock/tasks';
import { AlertCircle, Clock } from 'lucide-react';

/**
 * Status Badge Cell Renderer
 */
export function StatusCellRenderer(props: any) {
    const status: TaskStatus = props.value;

    const variantMap: Record<TaskStatus, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
        'completed': 'success',
        'in-progress': 'info',
        'testing': 'warning',
        'open': 'default',
        'blocked': 'danger',
    };

    return (
        <div className="h-full flex items-center">
            <Badge variant={variantMap[status] || 'default'} size="sm">
                {status}
            </Badge>
        </div>
    );
}

/**
 * Priority Cell Renderer
 */
export function PriorityCellRenderer(props: any) {
    const priority: TaskPriority = props.value;

    const variantMap: Record<TaskPriority, 'danger' | 'warning' | 'default'> = {
        'urgent': 'danger',
        'high': 'danger',
        'medium': 'warning',
        'low': 'default',
    };

    const iconMap: Record<TaskPriority, React.ReactNode> = {
        'urgent': <AlertCircle className="w-3 h-3 mr-1" />,
        'high': <AlertCircle className="w-3 h-3 mr-1" />,
        'medium': <Clock className="w-3 h-3 mr-1" />,
        'low': null,
    };

    return (
        <div className="h-full flex items-center">
            <Badge variant={variantMap[priority] || 'default'} size="sm">
                <div className="flex items-center">
                    {iconMap[priority]}
                    {priority}
                </div>
            </Badge>
        </div>
    );
}

/**
 * Assignee Avatar Cell Renderer
 */
export function AssigneeCellRenderer(props: any) {
    const assigneeId: string = props.value;
    const assignee = getUserById(assigneeId);

    if (!assignee) {
        return <div className="h-full flex items-center text-[var(--color-text-tertiary)]">Unassigned</div>;
    }

    return (
        <div className="h-full flex items-center gap-2">
            <Avatar name={assignee.name} size="xs" />
            <span className="text-sm text-[var(--color-text-primary)]">{assignee.name}</span>
        </div>
    );
}

/**
 * Date Cell Renderer
 */
export function DateCellRenderer(props: any) {
    const date: Date = props.value;

    if (!date) {
        return <div className="h-full flex items-center text-[var(--color-text-tertiary)]">-</div>;
    }

    const now = new Date();
    const isOverdue = date < now;
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="h-full flex items-center">
            <span
                className={
                    isOverdue
                        ? 'text-red-500 font-medium'
                        : 'text-[var(--color-text-secondary)]'
                }
            >
                {formattedDate}
            </span>
        </div>
    );
}

/**
 * Progress Cell Renderer
 */
export function ProgressCellRenderer(props: any) {
    const progress: number = props.value || 0;

    return (
        <div className="h-full flex items-center gap-2">
            <div className="flex-1 bg-[var(--color-bg-tertiary)] rounded-full h-2 max-w-[100px]">
                <div
                    className="bg-[var(--color-brand-primary)] h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-sm text-[var(--color-text-secondary)] min-w-[3ch] text-right">
                {progress}%
            </span>
        </div>
    );
}
