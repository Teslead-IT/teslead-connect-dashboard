'use client';

import React, { useState, useMemo } from 'react';
import { useTeams } from '@/hooks/use-teams';
import { useUser } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { 
    Search, 
    RefreshCcw, 
    Circle, 
    Utensils, 
    Coffee, 
    Home, 
    Moon, 
    Send, 
    X,
    MessageSquare,
    Users
} from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { UserPresenceStatus } from '@/stores/presenceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const STATUS_OPTIONS: { label: string; value: UserPresenceStatus; icon: React.ReactNode; color: string }[] = [
    { label: 'Online', value: 'ONLINE', icon: <Circle className="w-3 h-3 fill-green-500 text-green-500" />, color: 'text-green-500' },
    { label: 'Work from Home', value: 'WFH', icon: <Home className="w-3 h-3 text-blue-500" />, color: 'text-blue-500' },
    { label: 'Lunch', value: 'LUNCH', icon: <Utensils className="w-3 h-3 text-orange-500" />, color: 'text-orange-500' },
    { label: 'Break', value: 'BREAK', icon: <Coffee className="w-3 h-3 text-amber-600" />, color: 'text-amber-600' },
    { label: 'Checked Out', value: 'CHECKED_OUT', icon: <Moon className="w-3 h-3 text-indigo-500" />, color: 'text-indigo-500' },
    { label: 'Offline', value: 'OFFLINE', icon: <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />, color: 'text-gray-400' },
];

export default function TeamPage() {
    const { teams, isLoading, isError, updatePresence, isUpdating } = useTeams();
    const { data: user } = useUser();
    const toast = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<UserPresenceStatus | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const filteredTeams = useMemo(() => {
        return teams.filter(member => 
            member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.role.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery]);

    const handleUpdateStatus = () => {
        if (!selectedStatus) return;
        updatePresence({ status: selectedStatus, message: statusMessage }, {
            onSuccess: () => {
                toast.success('Presence status updated');
                setSelectedStatus(null);
                setStatusMessage('');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to update presence status');
            }
        });
    };

    const getStatusIcon = (status?: UserPresenceStatus) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return option?.icon || <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />;
    };

    const getStatusColor = (status?: UserPresenceStatus) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return option?.color || 'text-gray-400';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="mt-4 text-[var(--color-text-secondary)]">Loading team members...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Oops! Something went wrong</h3>
                <p className="text-[var(--color-text-secondary)] mt-2">Could not load team data. Please try refreshing.</p>
                <Button 
                    label="Retry" 
                    icon={<RefreshCcw className="w-4 h-4 mr-2" />} 
                    className="mt-6 p-button-outlined"
                    onClick={() => window.location.reload()}
                />
            </div>
        );
    }

    const currentUserMember = teams.find(m => m.user.id === user?.id);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header section with My Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-[var(--color-brand-primary)]" />
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                            Team Presence
                        </h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">
                        Stay connected with your team members in real-time.
                    </p>
                </div>

                {/* My Status Update Card */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-2xl p-4 shadow-sm min-w-[320px]">
                    <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
                        Update My Status
                    </h4>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Dropdown
                                value={selectedStatus || currentUserMember?.presence?.status}
                                options={STATUS_OPTIONS}
                                onChange={(e) => setSelectedStatus(e.value)}
                                placeholder="Select Status"
                                className="w-full md:w-36 h-10 border-[var(--color-border-primary)]"
                                itemTemplate={(option) => (
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                )}
                                valueTemplate={(option, props) => {
                                    if (!option) return <span>{props.placeholder}</span>;
                                    return (
                                        <div className="flex items-center gap-2">
                                            {option.icon}
                                            <span>{option.label}</span>
                                        </div>
                                    );
                                }}
                            />
                            <div className="relative flex-1 group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] transition-colors group-focus-within:text-[var(--color-brand-primary)]">
                                    <MessageSquare className="w-4 h-4" />
                                </span>
                                <InputText
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                    placeholder="What's happening?"
                                    className="w-full pl-9 h-10 bg-transparent border-[var(--color-border-primary)] focus:border-[var(--color-brand-primary)] transition-all"
                                />
                            </div>
                            <Button
                                icon={isUpdating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                onClick={handleUpdateStatus}
                                disabled={isUpdating || (!selectedStatus && statusMessage === '')}
                                className="h-10 w-10 p-0 rounded-lg bg-[var(--color-brand-primary)] border-none text-white hover:opacity-90 transition-opacity flex items-center justify-center shrink-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-border-primary)] p-4 rounded-xl">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-brand-primary)] transition-colors" />
                        <InputText
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 h-10 bg-gray-50/50 border-[var(--color-border-primary)] focus:bg-white transition-all rounded-lg"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] font-medium">
                        Showing <span className="text-[var(--color-brand-primary)]">{filteredTeams.length}</span> of {teams.length} members
                    </div>
                </div>

                <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTeams.map((member) => (
                            <motion.div
                                key={member.user.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className={clsx(
                                    "bg-[var(--color-surface)] border rounded-xl overflow-hidden transition-all duration-200 group relative",
                                    member.user.id === user?.id 
                                        ? "border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)] ring-opacity-10 shadow-md"
                                        : "border-[var(--color-border-primary)] hover:border-[var(--color-brand-primary)] hover:shadow-lg"
                                )}
                            >
                                {member.user.id === user?.id && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-[var(--color-brand-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                                            Me
                                        </div>
                                    </div>
                                )}
                                
                                <div className="p-5">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative flex-shrink-0">
                                            <Avatar 
                                                name={member.user.name} 
                                                src={member.user.avatarUrl}
                                                size="lg" 
                                                className="border-2 border-white shadow-sm"
                                            />
                                            <div className={clsx(
                                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110",
                                            )}>
                                                {getStatusIcon(member.presence?.status)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <h3 className="font-bold text-[var(--color-text-primary)] truncate leading-tight group-hover:text-[var(--color-brand-primary)] transition-colors">
                                                    {member.user.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-[var(--color-text-tertiary)] truncate mb-2">
                                                {member.user.email}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge
                                                    variant={
                                                        member.role === 'OWNER' ? 'warning' : 
                                                        member.role === 'ADMIN' ? 'info' : 
                                                        'default'
                                                    }
                                                    size="sm"
                                                    className="font-semibold text-[10px] py-0 px-2"
                                                >
                                                    {member.role}
                                                </Badge>
                                                {member.attendance?.status && member.attendance.status !== 'OFF' && (
                                                    <Badge variant="default" size="sm" className="text-[10px] py-0 px-2 border border-green-200 text-green-700 bg-green-50 capitalize">
                                                        {member.attendance.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    <div className="min-h-[40px] flex items-center mb-4">
                                        {member.presence?.message ? (
                                            <div className="w-full bg-gray-50/80 rounded-lg p-2.5 border border-dashed border-gray-200">
                                                <p className="text-xs italic text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                                                    "{member.presence.message}"
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                                                <span className={clsx("font-medium", getStatusColor(member.presence?.status))}>
                                                    {member.presence?.status?.replace('_', ' ') || 'OFFLINE'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-primary)] text-[10px] text-[var(--color-text-tertiary)]">
                                        <div className="flex items-center gap-1" title={`Joined on ${new Date(member.joinedAt).toLocaleDateString()}`}>
                                            Joined {formatDistanceToNow(new Date(member.joinedAt))} ago
                                        </div>
                                        {member.user.lastLoginAt && (
                                            <div title={`Last login at ${new Date(member.user.lastLoginAt).toLocaleString()}`}>
                                                Seen {formatDistanceToNow(new Date(member.user.lastLoginAt))} ago
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
                
                {filteredTeams.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border border-dashed border-[var(--color-border-primary)] rounded-2xl">
                        <Users className="w-16 h-16 text-gray-200 mb-4" />
                        <h4 className="text-lg font-semibold text-[var(--color-text-secondary)]">No team members found</h4>
                        <p className="text-sm text-[var(--color-text-tertiary)]">Try adjusting your search query</p>
                        <Button 
                            label="Clear Search" 
                            className="mt-6 p-button-text"
                            onClick={() => setSearchQuery('')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

