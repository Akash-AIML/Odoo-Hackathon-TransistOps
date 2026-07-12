'use client';

import { Bell, Search } from 'lucide-react';
import type { User } from '@/lib/api/types';

interface TopHeaderProps {
    user: User;
    notificationCount?: number;
}

export function TopHeader({ user, notificationCount = 0 }: TopHeaderProps) {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-card-border bg-background/80 px-6 backdrop-blur-md">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                    type="search"
                    placeholder="Search fleet, drivers, trips..."
                    className="w-full rounded-lg border border-card-border bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="relative rounded-lg border border-card-border bg-card p-2 text-muted hover:text-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                    )}
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
