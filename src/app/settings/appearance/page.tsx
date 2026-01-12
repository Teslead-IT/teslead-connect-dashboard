'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppearanceSettingsPage() {
    const { theme, setTheme } = useTheme();

    const themes = [
        {
            value: 'light' as const,
            label: 'Light',
            description: 'Light theme for daytime use',
            icon: <Sun className="w-6 h-6" />,
        },
        {
            value: 'dark' as const,
            label: 'Dark',
            description: 'Dark theme for low-light environments',
            icon: <Moon className="w-6 h-6" />,
        },
        {
            value: 'system' as const,
            label: 'System',
            description: 'Automatically switch based on system preference',
            icon: <Monitor className="w-6 h-6" />,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                    Appearance
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                    Customize the appearance of the application
                </p>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Theme
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themes.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setTheme(t.value)}
                            className={cn(
                                'p-4 rounded-lg border-2 transition-all',
                                'hover:border-[var(--color-brand-primary)]',
                                theme === t.value
                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5'
                                    : 'border-[var(--color-border-primary)]'
                            )}
                        >
                            <div className="flex flex-col items-center text-center gap-2">
                                <div
                                    className={cn(
                                        'w-12 h-12 rounded-full flex items-center justify-center',
                                        theme === t.value
                                            ? 'bg-[var(--color-brand-primary)] text-white'
                                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                                    )}
                                >
                                    {t.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--color-text-primary)]">
                                        {t.label}
                                    </p>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        {t.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border-primary)]">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Accessibility
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Reduce motion
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Minimize animations and transitions
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-[var(--color-border-primary)] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
