'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface AnalyticsChartsProps {
    monthlyData: Array<{ month: string; revenue: number }>;
    vehicleReports: Array<{
        name: string;
        financials: {
            totalExpenses: number;
        };
    }>;
    currency: string;
}

export function AnalyticsCharts({ monthlyData, vehicleReports, currency }: AnalyticsChartsProps) {
    // Sort vehicles by total expenses descending to get top costliest
    const costliestVehicles = [...vehicleReports]
        .sort((a, b) => b.financials.totalExpenses - a.financials.totalExpenses)
        .slice(0, 3);

    const maxExpense = costliestVehicles[0]?.financials.totalExpenses || 1;

    // Colors for the top 3 costliest vehicles in the wireframe:
    // 1st: Orange/Red, 2nd: Amber/Orange, 3rd: Blue/Cyan
    const colors = ['bg-orange-500', 'bg-amber-500', 'bg-blue-500'];

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Monthly Revenue */}
            <div className="rounded-xl border border-card-border bg-card p-5 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wider">Monthly Revenue</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                            <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                                formatter={(value) => [formatCurrency(Number(value), currency), 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#ff8c00" name="Revenue" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Column: Top Costliest Vehicles */}
            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between">
                <div>
                    <h3 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wider">Top Costliest Vehicles</h3>
                    <div className="space-y-5">
                        {costliestVehicles.map((vehicle, index) => {
                            const pct = Math.round((vehicle.financials.totalExpenses / maxExpense) * 100);
                            const color = colors[index] || 'bg-zinc-500';

                            return (
                                <div key={vehicle.name} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-foreground">{vehicle.name}</span>
                                        <span className="font-medium text-muted">
                                            {formatCurrency(vehicle.financials.totalExpenses, currency)}
                                        </span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-card-border">
                                        <div
                                            className={`h-full rounded-full ${color} transition-all duration-500`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="text-xs text-muted border-t border-card-border pt-3 mt-4">
                    Based on combined fuel, maintenance, tolls, and miscellaneous expenses.
                </div>
            </div>
        </div>
    );
}
