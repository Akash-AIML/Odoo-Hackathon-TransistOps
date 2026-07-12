'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface AnalyticsChartsProps {
    monthlyData: Array<{ month: string; revenue: number; cost: number }>;
    costBreakdown: Array<{ name: string; value: number; color: string }>;
}

export function AnalyticsCharts({ monthlyData, costBreakdown }: AnalyticsChartsProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-5 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-muted">Monthly Revenue vs Cost</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                            <YAxis stroke="#a3a3a3" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                            />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" fill="#ff8c00" name="Cost" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-muted">Cost Distribution</h3>
                <div className="space-y-4">
                    {costBreakdown.map((item) => {
                        const total = costBreakdown.reduce((s, c) => s + c.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <div key={item.name}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="text-muted">{pct}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-card-border">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 lg:col-span-3">
                <h3 className="mb-4 text-sm font-semibold text-muted">Fleet Efficiency Trend</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                            <YAxis stroke="#a3a3a3" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
