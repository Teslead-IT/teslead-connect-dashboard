import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/types/message';
import { cn } from '@/lib/utils';
import { Mail } from 'lucide-react';

interface MessageItemProps {
    message: Message;
    onMarkAsRead: (id: string) => void;
}

export function MessageItem({ message, onMarkAsRead }: MessageItemProps) {
    return (
        <div
            className={cn(
                "px-6 py-3 border-b border-slate-50 transition-all duration-150 cursor-pointer group",
                !message.read
                    ? "bg-slate-50/50"
                    : "bg-white hover:bg-slate-50/30"
            )}
            onClick={() => onMarkAsRead(message.id)}
        >
            <div className="flex gap-4 items-center h-7">
                {/* Status Indicator */}
                <div className="flex-shrink-0 w-1.5 flex justify-center">
                    {!message.read && (
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className={cn(
                        "flex-shrink-0 transition-colors",
                        !message.read ? "text-slate-600" : "text-slate-300 group-hover:text-slate-400"
                    )}>
                        <Mail className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-[12px] truncate tracking-tight",
                            !message.read ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
                        )}>
                            {message.content}
                        </p>
                        {message.sender && (
                            <p className="text-[10px] text-slate-400 truncate">
                                From: {message.sender.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Meta / Time */}
                <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap group-hover:text-slate-500 transition-colors">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>
        </div>
    );
}
