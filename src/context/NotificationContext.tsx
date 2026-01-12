'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '@/lib/utils';

export interface Notification {
    id: string;
    type: 'task_assigned' | 'status_changed' | 'comment_added' | 'due_date_reminder';
    title: string;
    message: string;
    projectId?: string;
    taskId?: string;
    read: boolean;
    timestamp: Date;
}

export interface NotificationPreferences {
    taskAssigned: boolean;
    statusChanged: boolean;
    commentAdded: boolean;
    dueDateReminders: boolean;
    mutedProjects: string[];
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
    muteProject: (projectId: string) => void;
    unmuteProject: (projectId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = 'app-notifications';
const PREFERENCES_KEY = 'app-notification-preferences';

const defaultPreferences: NotificationPreferences = {
    taskAssigned: true,
    statusChanged: true,
    commentAdded: true,
    dueDateReminders: true,
    mutedProjects: [],
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(NOTIFICATIONS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp),
                }));
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
        return [];
    });

    const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
        if (typeof window === 'undefined') return defaultPreferences;
        try {
            const stored = localStorage.getItem(PREFERENCES_KEY);
            if (stored) {
                return { ...defaultPreferences, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
        return defaultPreferences;
    });

    const saveNotifications = useCallback((notifs: Notification[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
        }
        setNotifications(notifs);
    }, []);

    const savePreferences = useCallback((prefs: NotificationPreferences) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
        }
        setPreferences(prefs);
    }, []);

    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
            const newNotification: Notification = {
                ...notification,
                id: generateId(),
                read: false,
                timestamp: new Date(),
            };
            saveNotifications([newNotification, ...notifications]);
        },
        [notifications, saveNotifications]
    );

    const markAsRead = useCallback(
        (id: string) => {
            const updated = notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            saveNotifications(updated);
        },
        [notifications, saveNotifications]
    );

    const markAllAsRead = useCallback(() => {
        const updated = notifications.map((n) => ({ ...n, read: true }));
        saveNotifications(updated);
    }, [notifications, saveNotifications]);

    const clearAll = useCallback(() => {
        saveNotifications([]);
    }, [saveNotifications]);

    const updatePreferences = useCallback(
        (newPreferences: Partial<NotificationPreferences>) => {
            savePreferences({ ...preferences, ...newPreferences });
        },
        [preferences, savePreferences]
    );

    const muteProject = useCallback(
        (projectId: string) => {
            if (!preferences.mutedProjects.includes(projectId)) {
                savePreferences({
                    ...preferences,
                    mutedProjects: [...preferences.mutedProjects, projectId],
                });
            }
        },
        [preferences, savePreferences]
    );

    const unmuteProject = useCallback(
        (projectId: string) => {
            savePreferences({
                ...preferences,
                mutedProjects: preferences.mutedProjects.filter((id) => id !== projectId),
            });
        },
        [preferences, savePreferences]
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                preferences,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                updatePreferences,
                muteProject,
                unmuteProject,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
