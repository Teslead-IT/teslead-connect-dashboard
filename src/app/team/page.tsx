'use client';

import React from 'react';
import { mockUsers } from '@/mock/users';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export default function TeamPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                    Team
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                    View and manage team members
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockUsers.map((user) => (
                    <div
                        key={user.id}
                        className="bg-[var(--color-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:border-[var(--color-brand-primary)] transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <Avatar name={user.name} size="lg" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                                    {user.name}
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)] truncate">
                                    {user.email}
                                </p>
                                <Badge variant="default" size="sm" className="mt-2">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
