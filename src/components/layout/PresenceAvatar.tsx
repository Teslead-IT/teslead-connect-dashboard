import React, { useState, useRef, useEffect } from 'react';
import { useUser, useLogout } from '@/hooks/use-auth';
import { usePresenceStore, UserPresenceStatus } from '@/stores/presenceStore';
import { useMutation } from '@tanstack/react-query';
import { teamsApi } from '@/services/teams.service';
import { Circle, Home, Utensils, Coffee, Moon, Settings, LogOut, Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

const STATUS_OPTIONS: { label: string; value: UserPresenceStatus; icon: React.ReactNode; dotIcon: React.ReactNode; dotClass: string }[] = [
    { label: 'Online', value: 'ONLINE', icon: <Circle className="w-3.5 h-3.5 fill-green-500 text-green-500" />, dotIcon: <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />, dotClass: 'bg-green-500' },
    { label: 'Work from Home', value: 'WFH', icon: <Home className="w-3 h-3 text-blue-500" />, dotIcon: <Home className="w-2.5 h-2.5 text-blue-500" />, dotClass: 'bg-blue-500' },
    { label: 'Lunch', value: 'LUNCH', icon: <Utensils className="w-3 h-3 text-orange-500" />, dotIcon: <Utensils className="w-2.5 h-2.5 text-orange-500" />, dotClass: 'bg-orange-500' },
    { label: 'Break', value: 'BREAK', icon: <Coffee className="w-3 h-3 text-amber-600" />, dotIcon: <Coffee className="w-2.5 h-2.5 text-amber-600" />, dotClass: 'bg-amber-500' },
    { label: 'Checked Out', value: 'CHECKED_OUT', icon: <Moon className="w-3 h-3 text-indigo-500" />, dotIcon: <Moon className="w-2.5 h-2.5 text-indigo-500" />, dotClass: 'bg-indigo-500' },
    { label: 'Offline', value: 'OFFLINE', icon: <Circle className="w-3.5 h-3.5 fill-gray-400 text-gray-400" />, dotIcon: <Circle className="w-2.5 h-2.5 fill-gray-400 text-gray-400" />, dotClass: 'bg-gray-400' },
];

export function PresenceAvatar() {
    const { data: user, isLoading } = useUser();
    const logout = useLogout();
    const presences = usePresenceStore((s) => s.presences);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentUserPresence = user?.id ? presences[user.id] : undefined;
    const currentStatus = currentUserPresence?.status || 'OFFLINE';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const { mutate: updateStatus, isPending } = useMutation({
        mutationFn: (status: UserPresenceStatus) => teamsApi.updateMyPresence(status),
    });

    if (isLoading || !user) {
        return <div className="w-8 h-8 rounded-lg animate-pulse bg-gray-200" />;
    }

    const displayName = user.name || user.username || user.email?.split('@')[0] || 'User';
    const displayAvatar = user.avatarUrl;

    // Find the current status option
    const activeOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus) || STATUS_OPTIONS[5];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative group focus:outline-none"
            >
                {displayAvatar ? (
                    <img
                        src={displayAvatar}
                        alt="Profile"
                        className="w-8 h-8 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-blue-50 transition-all shadow-sm"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#091590] to-[#071170] flex items-center justify-center text-white font-black text-xs shadow-inner uppercase">
                        {displayName.charAt(0)}
                    </div>
                )}

                {/* Dynamic Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[1.5px] border-white bg-white flex items-center justify-center shadow-sm">
                    {currentStatus === 'ONLINE' || currentStatus === 'OFFLINE' ? (
                        <div className={clsx("w-2 h-2 rounded-full", activeOption.dotClass)} />
                    ) : (
                        <div className="relative flex items-center justify-center">
                            {activeOption.dotIcon}
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-500 border border-white" />
                        </div>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="px-2 mb-2">
                        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Set Status</p>
                        <div className="space-y-0.5">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        updateStatus(option.value);
                                        setIsOpen(false);
                                    }}
                                    disabled={isPending}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50",
                                        currentStatus === option.value
                                            ? "bg-blue-50/50 text-[#091590] font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 flex justify-center">
                                            {option.icon}
                                        </div>
                                        <span>{option.label}</span>
                                    </div>
                                    {currentStatus === option.value && (
                                        <Check className="w-4 h-4 text-[#091590]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-50 pt-2 px-2">
                        <Link
                            href="/settings/account"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-gray-400" />
                                <span>Account Settings</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>

                        <button
                            onClick={() => logout.mutate()}
                            className="w-full flex items-center justify-between px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                        >
                            <div className="flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-red-400" />
                                <span>Logout</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
