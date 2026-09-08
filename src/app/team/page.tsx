'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTeams } from '@/hooks/use-teams';
import { useUser } from '@/hooks/use-auth';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { Loader } from '@/components/ui/Loader';
import {
    Search,
    RefreshCcw,
    Circle,
    Utensils,
    Coffee,
    Home,
    Moon,
    X,
    Users,
    Mail,
    Briefcase,
    Timer,
    Play,
    ListTodo,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserPresenceStatus } from '@/stores/presenceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<UserPresenceStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
    'ONLINE': {
        label: 'Online',
        icon: <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />,
        color: 'text-green-600',
        bgColor: 'bg-green-500',
        borderColor: 'border-green-200'
    },
    'WFH': {
        label: 'WFH',
        icon: <Home className="w-1.5 h-1.5 text-blue-500" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-200'
    },
    'LUNCH': {
        label: 'Lunch',
        icon: <Utensils className="w-1.5 h-1.5 text-orange-500" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500',
        borderColor: 'border-orange-200'
    },
    'BREAK': {
        label: 'Break',
        icon: <Coffee className="w-1.5 h-1.5 text-amber-600" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500',
        borderColor: 'border-amber-200'
    },
    'CHECKED_OUT': {
        label: 'Checked Out',
        icon: <Moon className="w-1.5 h-1.5 text-indigo-500" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-500',
        borderColor: 'border-indigo-200'
    },
    'OFFLINE': {
        label: 'Offline',
        icon: <Circle className="w-1.5 h-1.5 fill-gray-400 text-gray-400" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-400',
        borderColor: 'border-gray-200'
    },
};

function LiveTimer({ startedAt }: { startedAt: string }) {
    const [elapsed, setElapsed] = useState('');

    React.useEffect(() => {
        const calculateElapsed = () => {
            const start = new Date(startedAt).getTime();
            const now = Date.now();
            const diff = Math.max(0, now - start);
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const hDisplay = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
            return `${hDisplay}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setElapsed(calculateElapsed());
        const interval = setInterval(() => setElapsed(calculateElapsed()), 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    return <span>{elapsed}</span>;
}

export default function TeamPage() {
    const router = useRouter();
    const { teams, isLoading, isError } = useTeams();
    const { data: user } = useUser();
    const [expandedTimers, setExpandedTimers] = useState<Record<string, boolean>>({});

    console.log('--- TEAMS DATA ---', teams);

    const toggleTimer = (userId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedTimers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const [searchQuery, setSearchQuery] = useState('');

    const filteredTeams = useMemo(() => {
        return teams.filter(member =>
            member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="mt-4 text-gray-500 animate-pulse font-medium">Synchronizing team presence...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <X className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connection Interrupted</h3>
                <p className="text-gray-500 mt-2 max-w-sm">We're having trouble retrieving the team list.</p>
                <Button
                    variant="primary"
                    className="mt-8"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Uniform Header section */}
            <div className="border-b border-gray-100 py-3 px-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Team</h1>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200">
                            {filteredTeams.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="relative flex-1 sm:flex-initial sm:max-w-xs w-full lg:max-w-sm group transition-all">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50/20">
                <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredTeams.map((member) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={member.user.id}
                                    className="flex flex-col relative group/card cursor-pointer"
                                    onClick={() => router.push(`/team/${member.user.id}`)}
                                >
                                <div
                                    className={cn(
                                        "bg-white border rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex flex-col shadow-sm relative z-10 overflow-hidden",
                                        member.user.id === user?.id
                                            ? "border-blue-100 border-l-4 border-l-blue-600"
                                            : "border-gray-100"
                                    )}
                                >
                                    {/* Card Content Top */}
                                    <div className="p-3 flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <Avatar
                                                name={member.user.name}
                                                src={member.user.avatarUrl}
                                                size="md"
                                                className="rounded-lg"
                                            />
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-colors duration-300",
                                                STATUS_CONFIG[member.presence?.status || 'OFFLINE'].bgColor
                                            )}>
                                                {/* Status Dot */}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <p className="font-bold text-gray-900 group-hover/card:text-blue-600 transition-colors truncate text-[13px] tracking-tight">
                                                    {member.user.name}
                                                </p>
                                                {member.user.id === user?.id && (
                                                    <span className="bg-blue-600 text-white text-[8px] font-black px-1 rounded uppercase tracking-tighter shrink-0">
                                                        Me
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 truncate mt-0.5 lowercase">{member.user.email}</p>

                                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded leading-none border border-gray-200/50">
                                                    {member.role}
                                                </span>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none border",
                                                    STATUS_CONFIG[member.presence?.status || 'OFFLINE'].color,
                                                    STATUS_CONFIG[member.presence?.status || 'OFFLINE'].bgColor.replace('bg-', 'bg-') + '/10',
                                                    STATUS_CONFIG[member.presence?.status || 'OFFLINE'].borderColor
                                                )}>
                                                    {STATUS_CONFIG[member.presence?.status || 'OFFLINE'].label}
                                                </span>
                                                {member.attendance?.status === 'checked_in' && (
                                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none border text-emerald-600 bg-emerald-50 border-emerald-200">
                                                        Checked In
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0 ml-1">
                                            <div className="flex items-center gap-1 text-gray-400 group-hover/card:text-blue-600 transition-colors">
                                                <span className="text-[9px] font-bold uppercase">Tasks</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dedicated Bottom Row: Working Task & Project */}
                                    {(() => {
                                        const isNotWorking = (st?: string | null) => {
                                            if (!st) return false;
                                            const lower = st.toLowerCase().trim();
                                            return lower === 'not started' || lower === 'not_started' || lower === 'completed' || lower === 'done' || lower === 'closed';
                                        };

                                        const rawTask = member.activeTimer
                                            ? {
                                                  taskTitle: member.activeTimer.taskTitle,
                                                  projectName: member.activeTimer.projectName,
                                                  statusName: 'Working on it',
                                                  isTimerRunning: true,
                                                  startedAt: member.activeTimer.startedAt,
                                              }
                                            : member.currentTask && !isNotWorking(member.currentTask.statusName)
                                            ? {
                                                  taskTitle: member.currentTask.taskTitle,
                                                  projectName: member.currentTask.projectName,
                                                  statusName: member.currentTask.statusName || 'Working on it',
                                                  isTimerRunning: member.currentTask.isTimerRunning,
                                                  startedAt: null,
                                              }
                                            : null;

                                        const taskInfo = rawTask;

                                        const fullTooltip = taskInfo
                                            ? `${taskInfo.taskTitle}${taskInfo.projectName ? ` - ${taskInfo.projectName}` : ''} - ${taskInfo.statusName || 'Working on it'}`
                                            : 'No active task';

                                        return (
                                            <div
                                                className="border-t border-gray-100 bg-slate-50/80 px-3 py-2 flex items-center justify-between gap-2 text-[11px] relative"
                                                title={fullTooltip}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden" title={fullTooltip}>
                                                    {taskInfo?.isTimerRunning ? (
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" title={fullTooltip} />
                                                    ) : (
                                                        <span title={fullTooltip}>
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        </span>
                                                    )}

                                                    {taskInfo ? (
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden" title={fullTooltip}>
                                                            {/* 1. Task Title First */}
                                                            <span
                                                                className="font-bold text-slate-800 truncate text-[11px]"
                                                                title={fullTooltip}
                                                            >
                                                                {taskInfo.taskTitle}
                                                            </span>

                                                            {/* 2. Project Name Next */}
                                                            {taskInfo.projectName && (
                                                                <span
                                                                    className="bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-blue-200/60 shrink-0 truncate max-w-[100px]"
                                                                    title={fullTooltip}
                                                                >
                                                                    {taskInfo.projectName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[10px]">No active task</span>
                                                    )}
                                                </div>

                                                {/* 3. Status / Working Indicator */}
                                                {taskInfo && (
                                                    <div className="flex items-center gap-1 shrink-0" title={fullTooltip}>
                                                        {taskInfo.isTimerRunning && taskInfo.startedAt ? (
                                                            <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-2xs" title={fullTooltip}>
                                                                <Timer className="w-3 h-3 text-white" />
                                                                <LiveTimer startedAt={taskInfo.startedAt} />
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80" title={fullTooltip}>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                {taskInfo.statusName || 'Working on it'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Empty State */}
                    {filteredTeams.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Users className="w-12 h-12 text-gray-200" />
                            <h4 className="text-lg font-bold text-gray-400 mt-4">No members found</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

