import { redirect } from 'next/navigation';
import { AddVehicleForm } from '@/components/fleet/AddVehicleForm';
import { FleetTable } from '@/components/fleet/FleetTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { AlertBox } from '@/components/ui/AlertBox';
import { canAccessFleet, canCreateVehicle } from '@/lib/auth-helpers';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import { getDefaultRoute } from '@/lib/constants';
import type { PaginatedResponse, Vehicle } from '@/lib/api/types';

export default async function FleetPage() {
    const user = await getSessionUser();
    if (!user || !canAccessFleet(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let vehicles: Vehicle[] = [];
    let error = '';

    try {
        const res = await apiFetch<PaginatedResponse<Vehicle>>('/api/vehicles?limit=50');
        vehicles = res.data;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load vehicles.';
    }

    return (
        <div>
            <PageHeader
                title="Fleet Registry"
                description="Manage vehicles, health scores, and registration details"
                action={canCreateVehicle(user.role) ? <AddVehicleForm /> : undefined}
            />

            {error ? <AlertBox>{error}</AlertBox> : <FleetTable vehicles={vehicles} canCreate={canCreateVehicle(user.role)} />}
        </div>
    );
}
