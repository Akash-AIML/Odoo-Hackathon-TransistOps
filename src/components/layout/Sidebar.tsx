'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Fuel,
    LayoutDashboard,
    LogOut,
    Route,
    Settings,
    Truck,
    Users,
    Wrench,
} from 'lucide-react';
import { APP_NAME, NAV_ITEMS } from '@/lib/constants';
import type { User } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const ICONS = {
    LayoutDashboard,
    Truck,
    Users,
    Route,
    Wrench,
    Fuel,
    BarChart3,
    Settings,
};

interface SidebarProps {
    user: User;
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const visibleItems = NAV_ITEMS.filter(
        (item) => user.role === 'Admin' || (item.roles as readonly string[]).includes(user.role),
    );

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        document.cookie = 'accessToken=; path=/; max-age=0';
        document.cookie = 'transitops_user=; path=/; max-age=0';
        window.location.href = '/login';
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-card-border bg-sidebar">
            <div className="border-b border-card-border px-6 py-5">
                <p className="text-xl font-bold text-primary">{APP_NAME}</p>
                <p className="text-xs text-muted">Fleet Control Center</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {visibleItems.map((item) => {
                    const Icon = ICONS[item.icon as keyof typeof ICONS];
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted hover:bg-card hover:text-foreground',
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-card-border p-4">
                <div className="mb-3 rounded-lg bg-card px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted">{user.role}</p>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
