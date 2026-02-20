import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/invitation';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {

    return (
        <div
            className={cn(
                "relative flex gap-4 items-start p-4 rounded-2xl border transition-all duration-200 cursor-pointer group",
                "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
                !notification.read
                    ? "bg-slate-50 border-slate-200 shadow-sm"
                    : "bg-white border-slate-100 shadow-sm opacity-90 hover:opacity-100"
            )}
            onClick={() => onMarkAsRead(notification.id)}
        >
            {/* Unread Indicator Dot - Absolute positioned */}
            {!notification.read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-sm shadow-blue-200" />
            )}

            <div className="flex-shrink-0 mt-0.5">
                <div className={cn(
                    "p-2 rounded-xl transition-colors",
                    !notification.read ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-blue-500 group-hover:shadow-sm"
                )}>
                    {getIcon(notification.type)}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <p className={cn(
                    "text-[13px] leading-relaxed tracking-tight",
                    !notification.read ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"
                )}>
                    {notification.message}
                </p>

                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider group-hover:text-blue-400 transition-colors">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}

const getIcon = (type: Notification['type']) => {
    switch (type) {
        case 'INVITE_RECEIVED':
            return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>;
        case 'INVITE_ACCEPTED':
            return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'INVITE_REJECTED':
            return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'TASK_ASSIGNED':
            return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        case 'TASK_COMPLETED':
            return <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default:
            return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
};
