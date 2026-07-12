import { redirect } from 'next/navigation';
import { TripsTable } from '@/components/trips/TripsTable';
import { TripWizard } from '@/components/trips/TripWizard';
import { AlertBox } from '@/components/ui/AlertBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { Driver, PaginatedResponse, Settings, Trip, Vehicle } from '@/lib/api/types';
import { canDispatchTrips } from '@/lib/auth-helpers';

export default async function TripsPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    let trips: Trip[] = [];
    let vehicles: Vehicle[] = [];
    let drivers: Driver[] = [];
    let currency = 'INR';
    let error = '';

    try {
        const [tripsRes, settingsRes] = await Promise.all([
            apiFetch<PaginatedResponse<Trip>>('/api/trips?limit=50'),
            apiFetch<Settings>('/api/settings').catch(() => null),
        ]);
        trips = tripsRes.data;
        if (settingsRes) currency = settingsRes.currency;

        if (canDispatchTrips(user.role)) {
            const [vehiclesRes, driversRes] = await Promise.all([
                apiFetch<PaginatedResponse<Vehicle>>('/api/vehicles?limit=100&status=Available'),
                apiFetch<PaginatedResponse<Driver>>('/api/drivers?limit=100'),
            ]);
            vehicles = vehiclesRes.data;
            drivers = driversRes.data;
        }
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load trips.';
    }

    return (
        <div>
            <PageHeader
                title="Trip Dispatcher"
                description={
                    canDispatchTrips(user.role) ? 'Create and dispatch logistics trips' : 'View assigned trip activity'
                }
            />

            {error && <AlertBox className="mb-6">{error}</AlertBox>}

            {canDispatchTrips(user.role) && !error && (
                <div className="mb-8">
                    <TripWizard vehicles={vehicles} drivers={drivers} />
                </div>
            )}

            <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold">Trip History</h2>
                <TripsTable trips={trips} currency={currency} />
            </div>
        </div>
    );
}
