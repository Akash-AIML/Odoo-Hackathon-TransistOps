import type { User } from '@/lib/api/types';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
    user: User;
    notificationCount?: number;
    children: React.ReactNode;
}

export function AppShell({ user, notificationCount, children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar user={user} />
            <div className="pl-64">
                <TopHeader user={user} notificationCount={notificationCount} />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
