import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Driver } from '@/lib/api/types';
import { formatDate } from '@/lib/formatters';

interface DriversTableProps {
    drivers: Driver[];
}

export function DriversTable({ drivers }: DriversTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                    <tr>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">License</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Safety Score</th>
                        <th className="px-4 py-3">Compliance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                    {drivers.map((d) => (
                        <tr key={d.id} className="hover:bg-card/80">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                                        {d.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{d.name}</p>
                                        <p className="text-xs text-muted">Exp: {formatDate(d.expiryDate)}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{d.licenseNo}</td>
                            <td className="px-4 py-3">{d.category}</td>
                            <td className="px-4 py-3">
                                <StatusBadge status={d.status} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-card-border">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${d.safetyScore}%` }}
                                        />
                                    </div>
                                    <span className="text-xs">{d.safetyScore}%</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge status={d.complianceBadge ?? 'Compliant'} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
