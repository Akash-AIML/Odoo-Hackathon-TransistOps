import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Trip } from '@/lib/api/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface TripsTableProps {
    trips: Trip[];
    currency?: string;
}

export function TripsTable({ trips, currency = 'INR' }: TripsTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                    <tr>
                        <th className="px-4 py-3">Trip ID</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Revenue</th>
                        <th className="px-4 py-3">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                    {trips.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted">
                                No trips found.
                            </td>
                        </tr>
                    ) : (
                        trips.map((trip) => (
                            <tr key={trip.id} className="hover:bg-card/80">
                                <td className="px-4 py-3 font-mono text-xs">{trip.id}</td>
                                <td className="px-4 py-3">
                                    {trip.source} → {trip.destination}
                                </td>
                                <td className="px-4 py-3">{trip.driver?.name ?? '—'}</td>
                                <td className="px-4 py-3">{trip.vehicle?.name ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={trip.status} />
                                </td>
                                <td className="px-4 py-3">{formatCurrency(trip.revenue, currency)}</td>
                                <td className="px-4 py-3 text-muted">{formatDate(trip.createdAt)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
