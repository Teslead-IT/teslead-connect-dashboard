'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { notificationApi } from '@/services/notification.service';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const limit = 10;
    const queryClient = useQueryClient();

    const { data: notificationsData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['notifications', 'all', page, limit],
        queryFn: () => notificationApi.getAll({ page, limit }),
        placeholderData: keepPreviousData,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationApi.markAsRead,
        onSuccess: () => {
            // Invalidate both lists
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const handleNextPage = () => {
        if (notificationsData?.meta && page < notificationsData.meta.totalPages) {
            setPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(p => p - 1);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Header Section */}
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-200">
                                System Activity
                            </span>
                            {/* {notificationsData?.meta && (
                                <span className="text-[10px] font-medium text-slate-400">
                                    • {notificationsData.meta.total} events logged
                                </span>
                            )} */}
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[11px] font-bold text-slate-600 bg-white border-slate-200 shadow-sm"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-1.5 transition-transform", isFetching && "animate-spin")} />
                            Refresh Log
                        </Button>
                    </div>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col min-h-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {/* Optional: Table Style Header */}
                <div className="flex-shrink-0 grid grid-cols-[1fr_auto] px-6 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Receipt Time</span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#091590]" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Activity...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notificationsData?.data.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                />
                            ))}
                            {notificationsData?.data.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                        <Loader2 className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold">No notifications found</h3>
                                    <p className="text-sm text-gray-400 mt-1 max-w-[200px]">We'll let you know when something happens in your workspace</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sticky Pagination Footer */}
                {notificationsData?.meta && notificationsData.meta.totalPages > 1 && (
                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <span>Showing Page <span className="text-slate-900 font-black">{page}</span> / {notificationsData.meta.totalPages}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{notificationsData.meta.total} total records</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-[10px] font-bold px-3 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                onClick={handlePrevPage}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-[10px] font-bold px-3 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                onClick={handleNextPage}
                                disabled={page >= notificationsData.meta.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
