import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { Notification, PaginatedResponse } from '@/lib/api/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    let notificationCount = 0;
    try {
        const notifications = await apiFetch<PaginatedResponse<Notification>>('/api/notifications?limit=1');
        notificationCount = notifications.pagination.total;
    } catch {
        // Non-critical — badge stays at 0
    }

    return (
        <AppShell user={user} notificationCount={notificationCount}>
            {children}
        </AppShell>
    );
}
