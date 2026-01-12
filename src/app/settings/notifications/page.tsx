'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { mockProjects } from '@/mock/projects';
import { cn } from '@/lib/utils';

export default function NotificationSettingsPage() {
    const { preferences, updatePreferences, muteProject, unmuteProject } = useNotifications();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                    Notifications
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                    Manage how you receive notifications
                </p>
            </div>

            {/* Notification Types */}
            <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Email Notifications
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
                        <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Task Assigned
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Get notified when you're assigned to a new task
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.taskAssigned}
                            onChange={(e) => updatePreferences({ taskAssigned: e.target.checked })}
                            className="w-5 h-5 rounded border-[var(--color-border-primary)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
                        <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Status Changes
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Get notified when task status is updated
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.statusChanged}
                            onChange={(e) => updatePreferences({ statusChanged: e.target.checked })}
                            className="w-5 h-5 rounded border-[var(--color-border-primary)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
                        <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Comments
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Get notified when someone comments on your tasks
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.commentAdded}
                            onChange={(e) => updatePreferences({ commentAdded: e.target.checked })}
                            className="w-5 h-5 rounded border-[var(--color-border-primary)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
                        <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Due Date Reminders
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Get notified about upcoming task deadlines
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.dueDateReminders}
                            onChange={(e) => updatePreferences({ dueDateReminders: e.target.checked })}
                            className="w-5 h-5 rounded border-[var(--color-border-primary)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                    </label>
                </div>
            </div>

            {/* Muted Projects */}
            <div className="pt-6 border-t border-[var(--color-border-primary)]">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Muted Projects
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    You won't receive notifications from these projects
                </p>
                <div className="space-y-2">
                    {mockProjects.map((project) => {
                        const isMuted = preferences.mutedProjects.includes(project.id);
                        return (
                            <div
                                key={project.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-primary)]"
                            >
                                <span className="text-[var(--color-text-primary)]">{project.name}</span>
                                <Button
                                    variant={isMuted ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        if (isMuted) {
                                            unmuteProject(project.id);
                                        } else {
                                            muteProject(project.id);
                                        }
                                    }}
                                >
                                    {isMuted ? 'Unmute' : 'Mute'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
