import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MaintenanceLog } from '@/lib/api/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface MaintenanceTableProps {
    logs: MaintenanceLog[];
    currency?: string;
}

export function MaintenanceTable({ logs, currency = 'INR' }: MaintenanceTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                    <tr>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Service Type</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Cost</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-card/80">
                            <td className="px-4 py-3">{log.vehicle?.name ?? log.vehicleId}</td>
                            <td className="px-4 py-3">{log.serviceType}</td>
                            <td className="px-4 py-3">{formatDate(log.date)}</td>
                            <td className="px-4 py-3">{formatCurrency(log.cost, currency)}</td>
                            <td className="px-4 py-3">
                                <StatusBadge status={log.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
