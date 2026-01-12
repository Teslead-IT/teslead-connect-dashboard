'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Palette, Bell, User, Shield } from 'lucide-react';

const settingsNav = [
    {
        label: 'Appearance',
        href: '/settings/appearance',
        icon: <Palette className="w-4 h-4" />,
    },
    {
        label: 'Notifications',
        href: '/settings/notifications',
        icon: <Bell className="w-4 h-4" />,
    },
    {
        label: 'Profile',
        href: '/settings/profile',
        icon: <User className="w-4 h-4" />,
    },
    {
        label: 'Security',
        href: '/settings/security',
        icon: <Shield className="w-4 h-4" />,
    },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                    Settings
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Navigation */}
                <aside className="lg:col-span-1">
                    <nav className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-2">
                        {settingsNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                                        'hover:bg-[var(--color-bg-hover)]',
                                        isActive && 'bg-[var(--color-brand-primary)] text-white hover:text-white'
                                    )}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
