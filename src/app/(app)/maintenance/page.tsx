import { redirect } from 'next/navigation';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { AlertBox } from '@/components/ui/AlertBox';
import { canAccessMaintenance } from '@/lib/auth-helpers';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import { getDefaultRoute } from '@/lib/constants';
import type { MaintenanceLog, PaginatedResponse, Settings } from '@/lib/api/types';

export default async function MaintenancePage() {
    const user = await getSessionUser();
    if (!user || !canAccessMaintenance(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let logs: MaintenanceLog[] = [];
    let currency = 'INR';
    let error = '';

    try {
        const [logsRes, settingsRes] = await Promise.all([
            apiFetch<PaginatedResponse<MaintenanceLog>>('/api/maintenance?limit=50'),
            apiFetch<Settings>('/api/settings').catch(() => null),
        ]);
        logs = logsRes.data;
        if (settingsRes) currency = settingsRes.currency;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load maintenance logs.';
    }

    const inShop = logs.filter((l) => l.status === 'In Shop');

    return (
        <div>
            <PageHeader
                title="Maintenance"
                description="Vehicle service history and active repair queue"
            />

            {error ? (
                <AlertBox>{error}</AlertBox>
            ) : (
                <>
                    {inShop.length > 0 && (
                        <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                            <p className="text-sm font-medium text-orange-300">
                                {inShop.length} vehicle{inShop.length > 1 ? 's' : ''} currently in shop
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-card-border">
                                <div
                                    className="h-full rounded-full bg-orange-500 transition-all"
                                    style={{ width: `${Math.min(100, (inShop.length / Math.max(logs.length, 1)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <MaintenanceTable logs={logs} currency={currency} />
                </>
            )}
        </div>
    );
}
