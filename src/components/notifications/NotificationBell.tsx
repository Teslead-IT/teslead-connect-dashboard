/**
 * Notification Bell Component
 * Displays real-time notifications with badge count
 * Shows pending invitations and other notifications
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/use-notifications';
import { usePendingInvites } from '@/hooks/use-invitations';
import { PendingInvitesList } from '@/components/invitations/PendingInvitesList';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/invitation';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount: notifUnreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearAll,
    } = useNotifications({
        autoConnect: true,
        autoInvalidate: true,
    });

    const { data: pendingInvites = [] } = usePendingInvites();

    // Total unread count (notifications + pending invites)
    const totalUnread = notifUnreadCount + pendingInvites.length;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                aria-label="Notifications"
            >
                {/* Bell Icon */}
                <svg
                    className="w-6 h-6 text-[var(--color-text-secondary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge Count */}
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-[var(--color-bg-primary)]">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}

                {/* Connection Status Indicator */}
                {isConnected && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-[var(--color-bg-primary)]" />
                )}
            </button>

            {/* Dropdown Panel */}
            <div
                className={`absolute right-0 mt-2 w-96 max-h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-200 ease-out origin-top-right transform ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                            Notifications
                            {totalUnread > 0 && (
                                <span className="ml-2 text-sm text-[var(--color-text-tertiary)]">
                                    ({totalUnread})
                                </span>
                            )}
                        </h3>

                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[var(--color-brand-primary)] hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                    <span className="text-[var(--color-text-tertiary)]">•</span>
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[500px]">
                    {/* Pending Invitations Section */}
                    {pendingInvites.length > 0 && (
                        <div className="border-b border-[var(--color-border-primary)]">
                            <div className="px-4 py-2 bg-[var(--color-bg-secondary)]">
                                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                    Pending Invitations ({pendingInvites.length})
                                </h4>
                            </div>
                            <div className="p-3">
                                <PendingInvitesList compact limit={3} />
                            </div>
                        </div>
                    )}

                    {/* Notifications Section */}
                    {notifications.length > 0 && (
                        <div>
                            {/* Only show header if there are mixed content types, otherwise concise is better */}
                            {pendingInvites.length > 0 && (
                                <div className="px-4 py-2 bg-[var(--color-bg-secondary)]">
                                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                        Recent Activity ({notifications.length})
                                    </h4>
                                </div>
                            )}
                            <div className="divide-y divide-[var(--color-border-primary)]">
                                {notifications.slice(0, 10).map((notification: Notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {totalUnread === 0 && notifications.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full mb-3">
                                <svg
                                    className="w-8 h-8 text-[var(--color-text-tertiary)]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] font-medium mb-1">
                                All caught up!
                            </p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">
                                No new notifications
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer (if needed) */}
                {(notifications.length > 10 || pendingInvites.length > 3) && (
                    <div className="sticky bottom-0 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                setIsOpen(false);
                                window.location.href = '/notifications';
                            }}
                        >
                            View All Notifications
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== NOTIFICATION ITEM COMPONENT ====================

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'INVITE_RECEIVED':
                return (
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                    </div>
                );
            case 'INVITE_ACCEPTED':
                return (
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'INVITE_REJECTED':
                return (
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div
            className={`px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer border-l-[3px] group ${!notification.read
                ? 'bg-indigo-50 border-[#091590] border-l-[3px]'
                : 'bg-white border-transparent hover:border-gray-200'
                }`}
            onClick={() => onMarkAsRead(notification.id)}
        >
            <div className="flex gap-3.5 items-start">
                <div className="mt-0.5">
                    {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm mb-1 leading-snug ${!notification.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {notification.message}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide font-medium text-gray-400 group-hover:text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                </div>
                {!notification.read && (
                    <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full mt-2 self-start ring-2 ring-indigo-50" />
                )}
            </div>
        </div>
    );
}
