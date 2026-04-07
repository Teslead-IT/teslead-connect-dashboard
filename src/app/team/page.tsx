'use client';

import React, { useState, useMemo } from 'react';
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
    Play
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
    const { teams, isLoading, isError } = useTeams();
    const { data: user } = useUser();
    const [expandedTimers, setExpandedTimers] = useState<Record<string, boolean>>({});

    console.log('--- TEAMS DATA ---', teams);

    const toggleTimer = (userId: string) => {
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
                                    className="flex flex-col relative"
                                >
                                <div
                                    className={cn(
                                        "bg-white border rounded-lg p-3 hover:border-gray-300 transition-all duration-200 group flex items-center gap-3 shadow-sm relative z-10",
                                        member.user.id === user?.id
                                            ? "border-blue-100 border-l-4 border-l-blue-600"
                                            : "border-gray-100"
                                    )}
                                >
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
                                            <p className="font-bold text-gray-900 truncate text-[13px] tracking-tight">
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
                                        <p className="text-[9px] text-gray-400 font-medium">
                                            {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: false })}
                                        </p>
                                        
                                        {member.activeTimer && (
                                            <button 
                                                onClick={() => toggleTimer(member.user.id)}
                                                className={cn(
                                                    "p-1 transition-all duration-300 relative group/timer flex items-center justify-center",
                                                    expandedTimers[member.user.id] 
                                                        ? "text-indigo-600 scale-110" 
                                                        : "text-indigo-600 hover:scale-110"
                                                )}
                                            >
                                                <div className="relative w-6 h-6 z-10 flex items-center justify-center">
                                                    <Image 
                                                        src="/icons/timer.gif" 
                                                        alt="Timer running" 
                                                        width={24} 
                                                        height={24}
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {member.activeTimer && expandedTimers[member.user.id] && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0, marginTop: -12 }}
                                            animate={{ height: 'auto', opacity: 1, marginTop: -12 }}
                                            exit={{ height: 0, opacity: 0, marginTop: -12 }}
                                            className="overflow-hidden z-0"
                                        >
                                            <div className="mx-4 mb-2 relative pt-6 pb-2.5 px-3 bg-gradient-to-b from-white to-indigo-50/30 border border-t-0 border-indigo-100 rounded-b-xl flex items-center justify-between pointer-events-none shadow-[0_4px_12px_-4px_rgba(9,21,144,0.08)]">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                                                <Image 
                                                    src="/icons/timer.png" 
                                                    alt="Timer" 
                                                    width={20} 
                                                    height={20}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-0 min-w-0">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#091590]">
                                                    {member.activeTimer.projectName || 'Active Task'}
                                                </span>
                                                <p className="text-[11px] font-bold truncate max-w-[140px] text-gray-700 leading-tight mt-0.5">
                                                    {member.activeTimer.taskTitle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center shrink-0 relative overflow-hidden bg-[#091590] px-2 py-1 rounded-md shadow-sm border border-[#091590]/20">
                                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                            <div className="relative flex items-center gap-1.5">
                                                <Timer className="w-3 h-3 text-white" />
                                                <span className="text-[10px] font-black font-mono tracking-widest text-white uppercase">
                                                    <LiveTimer startedAt={member.activeTimer.startedAt} />
                                                </span>
                                            </div>
                                        </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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

