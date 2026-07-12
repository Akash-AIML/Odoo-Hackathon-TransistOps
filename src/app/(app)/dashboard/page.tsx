import { redirect } from 'next/navigation';
import { FleetDistribution } from '@/components/charts/FleetDistribution';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { AlertBox } from '@/components/ui/AlertBox';
import { canAccessDashboard } from '@/lib/auth-helpers';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import { getDefaultRoute } from '@/lib/constants';
import type { DashboardData } from '@/lib/api/types';
import { formatPercent } from '@/lib/formatters';

export default async function DashboardPage() {
    const user = await getSessionUser();
    if (!user || !canAccessDashboard(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let data: DashboardData | null = null;
    let error = '';

    try {
        data = await apiFetch<DashboardData>('/api/dashboard');
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load dashboard.';
    }

    if (error || !data) {
        return (
            <div>
                <PageHeader title="Dashboard" description="Operational overview" />
                <AlertBox>{error || 'Unable to load dashboard data.'}</AlertBox>
            </div>
        );
    }

    const chartData = [
        { name: 'Available', value: data.statusCounts.Available, color: '#10b981' },
        { name: 'On Trip', value: data.statusCounts.OnTrip, color: '#3b82f6' },
        { name: 'In Shop', value: data.statusCounts.InShop, color: '#ff8c00' },
        { name: 'Retired', value: data.statusCounts.Retired, color: '#71717a' },
    ];

    return (
        <div>
            <PageHeader title="Dashboard" description="Real-time fleet operations overview" />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Fleet Health" value={formatPercent(data.metrics.fleetHealth)} />
                <StatCard label="Fleet Utilization" value={formatPercent(data.metrics.fleetUtilization)} />
                <StatCard label="Drivers Available" value={data.metrics.driversAvailable} />
                <StatCard label="Maintenance Alerts" value={data.metrics.maintenanceAlerts} />
                <StatCard label="Today's Trips" value={data.metrics.todayTrips} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-card-border bg-card">
                        <div className="border-b border-card-border px-4 py-3">
                            <h2 className="font-semibold">Recent Trips</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-card-border text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-2">Trip</th>
                                    <th className="px-4 py-2">Route</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {data.recentTrips.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-muted">
                                            No recent trips.
                                        </td>
                                    </tr>
                                ) : (
                                    data.recentTrips.map((trip) => (
                                        <tr key={trip.id}>
                                            <td className="px-4 py-2 font-mono text-xs">{trip.id}</td>
                                            <td className="px-4 py-2">
                                                {trip.source} → {trip.destination}
                                            </td>
                                            <td className="px-4 py-2">
                                                <StatusBadge status={trip.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {data.alerts.length > 0 && (
                        <div className="mt-6 rounded-xl border border-card-border bg-card p-4">
                            <h2 className="mb-3 font-semibold">Recent Alerts</h2>
                            <ul className="space-y-2 text-sm">
                                {data.alerts.slice(0, 5).map((alert) => (
                                    <li
                                        key={alert.id}
                                        className="rounded-lg border border-card-border bg-background/50 px-3 py-2"
                                    >
                                        {alert.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-card-border bg-card p-5">
                    <h2 className="mb-4 font-semibold">Vehicle Distribution</h2>
                    <FleetDistribution data={chartData} />

                    {data.maintenanceQueue.length > 0 && (
                        <div className="mt-6 border-t border-card-border pt-4">
                            <h3 className="mb-2 text-sm font-semibold text-muted">Maintenance Queue</h3>
                            <ul className="space-y-2 text-sm">
                                {data.maintenanceQueue.map((log) => (
                                    <li key={log.id} className="flex justify-between">
                                        <span>{log.vehicle?.name ?? log.vehicleId}</span>
                                        <span className="text-muted">{log.serviceType}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
