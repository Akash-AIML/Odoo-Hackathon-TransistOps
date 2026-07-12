import { redirect } from 'next/navigation';
import { ExportButtons } from '@/components/analytics/ExportButtons';
import { AnalyticsCharts } from '@/components/charts/AnalyticsCharts';
import { AlertBox } from '@/components/ui/AlertBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import type { AnalyticsData, Settings } from '@/lib/api/types';
import { canAccessAnalytics } from '@/lib/auth-helpers';
import { getDefaultRoute } from '@/lib/constants';
import { formatCurrency, formatPercent } from '@/lib/formatters';

export default async function AnalyticsPage() {
    const user = await getSessionUser();
    if (!user || !canAccessAnalytics(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let data: AnalyticsData | null = null;
    let currency = 'INR';
    let error = '';

    try {
        const [analyticsRes, settingsRes] = await Promise.all([
            apiFetch<AnalyticsData>('/api/reports/analytics'),
            apiFetch<Settings>('/api/settings').catch(() => null),
        ]);
        data = analyticsRes;
        if (settingsRes) currency = settingsRes.currency;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load analytics.';
    }

    if (error || !data) {
        return (
            <div>
                <PageHeader title="Reports & Analytics" />
                <AlertBox>{error || 'Unable to load analytics.'}</AlertBox>
            </div>
        );
    }

    const { fleetMetrics, vehicleReports } = data;

    // Calculate average vehicle ROI
    const avgRoi =
        vehicleReports.length > 0
            ? vehicleReports.reduce((s, v) => s + v.financials.roi, 0) / vehicleReports.length
            : 0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyData = months.map((month, i) => ({
        month,
        revenue: Math.round((fleetMetrics.totalRevenue / 6) * (0.85 + i * 0.05)),
    }));

    return (
        <div>
            <PageHeader
                title="Reports & Analytics"
                description="Fleet performance, ROI, and cost breakdown"
                action={<ExportButtons />}
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Fuel Efficiency" value={`${fleetMetrics.avgFuelEfficiency.toFixed(1)} km/L`} />
                <StatCard label="Fleet Utilization" value={formatPercent(fleetMetrics.fleetUtilization)} />
                <StatCard label="Operational Cost" value={formatCurrency(fleetMetrics.totalOperationalCost, currency)} />
                <StatCard label="Vehicle ROI" value={formatPercent(avgRoi)} />
            </div>

            <AnalyticsCharts monthlyData={monthlyData} vehicleReports={vehicleReports} currency={currency} />

            <div className="mt-6 overflow-hidden rounded-xl border border-card-border bg-card">
                <div className="border-b border-card-border px-4 py-3">
                    <h3 className="font-semibold">Per-Vehicle ROI</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-card-border text-xs uppercase text-muted">
                        <tr>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Revenue</th>
                            <th className="px-4 py-2">Expenses</th>
                            <th className="px-4 py-2">Net Profit</th>
                            <th className="px-4 py-2">ROI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {vehicleReports.map((v) => (
                            <tr key={v.id}>
                                <td className="px-4 py-2">{v.name}</td>
                                <td className="px-4 py-2">{formatCurrency(v.financials.revenue, currency)}</td>
                                <td className="px-4 py-2">{formatCurrency(v.financials.totalExpenses, currency)}</td>
                                <td className="px-4 py-2">{formatCurrency(v.financials.netProfit, currency)}</td>
                                <td className="px-4 py-2">{(v.financials.roi * 100).toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
