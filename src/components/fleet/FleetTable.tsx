import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Vehicle } from '@/lib/api/types';
import { formatNumber } from '@/lib/formatters';

interface FleetTableProps {
    vehicles: Vehicle[];
    canCreate?: boolean;
}

export function FleetTable({ vehicles, canCreate }: FleetTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                        <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Plate #</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Health</th>
                            <th className="px-4 py-3">Odometer</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {vehicles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                                    No vehicles found.
                                </td>
                            </tr>
                        ) : (
                            vehicles.map((v) => (
                                <tr key={v.id} className="hover:bg-card/80">
                                    <td className="px-4 py-3">{v.type}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{v.regNo}</td>
                                    <td className="px-4 py-3">{v.name}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={v.status} />
                                    </td>
                                    <td className="px-4 py-3">{v.health}%</td>
                                    <td className="px-4 py-3">{formatNumber(v.odometer)} km</td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/fleet/${v.regNo}`}
                                            className="text-sm font-medium text-primary hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {!canCreate && vehicles.length === 0 && (
                <p className="border-t border-card-border px-4 py-3 text-xs text-muted">
                    Contact a Fleet Manager to add vehicles.
                </p>
            )}
        </div>
    );
}
