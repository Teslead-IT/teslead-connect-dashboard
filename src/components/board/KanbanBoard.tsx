'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Task, WorkflowStage, Status } from '@/types/task';
import { taskService, workflowService } from '@/services/tasks.service';
import { Plus, MoreVertical, Calendar, User, Flag } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

interface KanbanBoardProps {
    projectId: string;
}

interface GroupedTasks {
    [stageId: string]: Task[];
}

const PRIORITY_COLORS = {
    1: 'text-gray-400 bg-gray-100',
    2: 'text-blue-600 bg-blue-100',
    3: 'text-yellow-600 bg-yellow-100',
    4: 'text-orange-600 bg-orange-100',
    5: 'text-red-600 bg-red-100',
};

const PRIORITY_LABELS = {
    1: 'Lowest',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical',
};

export function KanbanBoard({ projectId }: KanbanBoardProps) {
    const [workflow, setWorkflow] = useState<WorkflowStage[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Load workflow and tasks
    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load workflow and tasks in parallel
            const [workflowData, tasksData] = await Promise.all([
                workflowService.getWorkflow(projectId),
                taskService.getTasks(projectId),
            ]);

            setWorkflow(workflowData);
            setTasks(tasksData);

            // Group tasks by stage
            const grouped: GroupedTasks = {};
            workflowData.forEach(stage => {
                grouped[stage.id] = tasksData.filter(task => {
                    // Find which stage this task's status belongs to
                    return stage.statuses.some(status => status.id === task.status.id);
                });
            });

            setGroupedTasks(grouped);
        } catch (err) {
            console.error('Failed to load board data:', err);
            setError('Failed to load board data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stageId: string, status: Status) => {
        if (!draggedTask) return;

        try {
            // Update task status
            const updatedTask = await taskService.updateTask(draggedTask.id, {
                statusId: status.id,
            });

            // Update local state
            setTasks(prevTasks =>
                prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
            );

            // Regroup tasks
            const newGrouped: GroupedTasks = {};
            workflow.forEach(stage => {
                newGrouped[stage.id] = tasks
                    .map(t => (t.id === updatedTask.id ? updatedTask : t))
                    .filter(task => {
                        return stage.statuses.some(s => s.id === task.status.id);
                    });
            });

            setGroupedTasks(newGrouped);
        } catch (err) {
            console.error('Failed to update task status:', err);
            setError('Failed to update task. Please try again.');
        } finally {
            setDraggedTask(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-600 font-medium mb-2">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Board Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Board View</h2>
                <button
                    onClick={loadData}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    Refresh
                </button>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {workflow.map(stage => {
                        const defaultStatus = stage.statuses.find(s => s.isDefault) || stage.statuses[0];
                        const stageTasks = groupedTasks[stage.id] || [];

                        return (
                            <div
                                key={stage.id}
                                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                                {stageTasks.length}
                                            </span>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={() => defaultStatus && handleDrop(stage.id, defaultStatus)}
                                    className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto"
                                >
                                    {stageTasks.filter(t => !t.parentId).map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onDragStart={() => handleDragStart(task)}
                                            subtasks={stageTasks.filter(t => t.parentId === task.id)}
                                        />
                                    ))}

                                    {stageTasks.filter(t => !t.parentId).length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            No tasks
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface TaskCardProps {
    task: Task;
    subtasks: Task[];
    onDragStart: () => void;
}

function TaskCard({ task, subtasks, onDragStart }: TaskCardProps) {
    const priorityClass = PRIORITY_COLORS[task.priority];
    const priorityLabel = PRIORITY_LABELS[task.priority];

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        >
            {/* Task Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h4>
                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Task Description */}
            {task.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Task Meta */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Priority */}
                <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', priorityClass)}>
                    <Flag className="w-3 h-3" />
                    {priorityLabel}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                        })}
                    </div>
                )}

                {/* Assignees */}
                {task.assigneeIds.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {task.assigneeIds.length}
                    </div>
                )}
            </div>

            {/* Subtasks */}
            {subtasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-2">
                        Subtasks ({subtasks.length})
                    </div>
                    <div className="space-y-1">
                        {subtasks.slice(0, 3).map(subtask => (
                            <div key={subtask.id} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-gray-400">•</span>
                                <span className="flex-1 line-clamp-1">{subtask.title}</span>
                            </div>
                        ))}
                        {subtasks.length > 3 && (
                            <div className="text-xs text-gray-400">
                                +{subtasks.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status Badge */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <div
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        color: task.status.id,
                        backgroundColor: `${task.status.id}20`,
                    }}
                >
                    {task.status.name}
                </div>
            </div>
        </div>
    );
}
