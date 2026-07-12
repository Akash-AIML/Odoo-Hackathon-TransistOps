import { redirect } from 'next/navigation';
import { DriversTable } from '@/components/drivers/DriversTable';
import { AlertBox } from '@/components/ui/AlertBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { Driver, PaginatedResponse } from '@/lib/api/types';
import { canAccessDrivers } from '@/lib/auth-helpers';
import { getDefaultRoute } from '@/lib/constants';

export default async function DriversPage() {
    const user = await getSessionUser();
    if (!user || !canAccessDrivers(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let drivers: Driver[] = [];
    let error = '';

    try {
        const res = await apiFetch<PaginatedResponse<Driver>>('/api/drivers?limit=50');
        drivers = res.data;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load drivers.';
    }

    return (
        <div>
            <PageHeader title="Drivers & Safety" description="Driver profiles, license compliance, and safety scores" />

            {error ? <AlertBox>{error}</AlertBox> : <DriversTable drivers={drivers} />}
        </div>
    );
}
