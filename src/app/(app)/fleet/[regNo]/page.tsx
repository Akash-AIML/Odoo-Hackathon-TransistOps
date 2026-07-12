import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AlertBox } from '@/components/ui/AlertBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { Vehicle } from '@/lib/api/types';
import { canAccessFleet } from '@/lib/auth-helpers';
import { getDefaultRoute } from '@/lib/constants';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';

interface FleetDetailPageProps {
    params: Promise<{ regNo: string }>;
}

export default async function FleetDetailPage({ params }: FleetDetailPageProps) {
    const { regNo } = await params;
    const user = await getSessionUser();
    if (!user || !canAccessFleet(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let vehicle:
        | (Vehicle & {
              trips?: Array<{ id: string; source: string; destination: string; status: string; createdAt: string }>;
              maintenanceLogs?: Array<{ id: string; serviceType: string; date: string; cost: number; status: string }>;
              fuelLogs?: Array<{ id: string; date: string; liters: number; cost: number; isAnomaly: boolean }>;
          })
        | null = null;
    let error = '';

    try {
        vehicle = await apiFetch(`/api/vehicles/${encodeURIComponent(regNo)}`);
    } catch (e) {
        error = e instanceof Error ? e.message : 'Vehicle not found.';
    }

    if (error.includes('404') || error.includes('not found')) {
        notFound();
    }

    if (error || !vehicle) {
        return (
            <div>
                <PageHeader title="Vehicle Profile" />
                <AlertBox>{error || 'Vehicle not found.'}</AlertBox>
                <Link href="/fleet" className="mt-4 inline-block text-sm text-primary hover:underline">
                    ← Back to fleet
                </Link>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={vehicle.name}
                description={`Registration: ${vehicle.regNo}`}
                action={
                    <Link href="/fleet" className="text-sm text-primary hover:underline">
                        ← Back to fleet
                    </Link>
                }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-card-border bg-card p-4">
                    <p className="text-sm text-muted">Status</p>
                    <div className="mt-2">
                        <StatusBadge status={vehicle.status} />
                    </div>
                </div>
                <div className="rounded-xl border border-card-border bg-card p-4">
                    <p className="text-sm text-muted">Health Score</p>
                    <p className="mt-2 text-2xl font-bold">{vehicle.health}%</p>
                </div>
                <div className="rounded-xl border border-card-border bg-card p-4">
                    <p className="text-sm text-muted">Odometer</p>
                    <p className="mt-2 text-2xl font-bold">{formatNumber(vehicle.odometer)} km</p>
                </div>
                <div className="rounded-xl border border-card-border bg-card p-4">
                    <p className="text-sm text-muted">Capacity</p>
                    <p className="mt-2 text-2xl font-bold">{formatNumber(vehicle.capacity)} kg</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-card-border bg-card p-5">
                    <h3 className="font-semibold">Recent Trips</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        {(vehicle.trips ?? []).slice(0, 5).map((trip) => (
                            <li
                                key={trip.id}
                                className="flex items-center justify-between border-b border-card-border pb-2"
                            >
                                <span>
                                    {trip.source} → {trip.destination}
                                </span>
                                <StatusBadge status={trip.status} />
                            </li>
                        ))}
                        {(vehicle.trips ?? []).length === 0 && <li className="text-muted">No trips recorded.</li>}
                    </ul>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-5">
                    <h3 className="font-semibold">Maintenance History</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        {(vehicle.maintenanceLogs ?? []).slice(0, 5).map((log) => (
                            <li
                                key={log.id}
                                className="flex items-center justify-between border-b border-card-border pb-2"
                            >
                                <span>
                                    {log.serviceType} — {formatDate(log.date)}
                                </span>
                                <span>{formatCurrency(log.cost)}</span>
                            </li>
                        ))}
                        {(vehicle.maintenanceLogs ?? []).length === 0 && (
                            <li className="text-muted">No maintenance logs.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
