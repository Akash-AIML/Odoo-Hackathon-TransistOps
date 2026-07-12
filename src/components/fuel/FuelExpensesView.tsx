import type { Expense, FuelLog } from '@/lib/api/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface FuelExpensesViewProps {
    fuelLogs: FuelLog[];
    expenses: Expense[];
    currency?: string;
}

export function FuelExpensesView({ fuelLogs, expenses, currency = 'INR' }: FuelExpensesViewProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-card-border bg-card">
                <div className="border-b border-card-border px-4 py-3">
                    <h3 className="font-semibold">Fuel Logs</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-card-border text-xs uppercase text-muted">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Liters</th>
                            <th className="px-4 py-2">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {fuelLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-2">{formatDate(log.date)}</td>
                                <td className="px-4 py-2">{log.vehicle?.name}</td>
                                <td className="px-4 py-2">{log.liters} L</td>
                                <td className="px-4 py-2">
                                    {formatCurrency(log.cost, currency)}
                                    {log.isAnomaly && <span className="ml-2 text-xs text-red-400">Anomaly</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-card-border bg-card">
                <div className="border-b border-card-border px-4 py-3">
                    <h3 className="font-semibold">General Expenses</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-card-border text-xs uppercase text-muted">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Toll</th>
                            <th className="px-4 py-2">Other</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {expenses.map((exp) => (
                            <tr key={exp.id}>
                                <td className="px-4 py-2">{formatDate(exp.date)}</td>
                                <td className="px-4 py-2">{exp.vehicle?.name}</td>
                                <td className="px-4 py-2">{formatCurrency(exp.toll, currency)}</td>
                                <td className="px-4 py-2">{formatCurrency(exp.other, currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
