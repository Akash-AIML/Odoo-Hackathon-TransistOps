'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function ReportsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/reports/analytics', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setAnalytics(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <DashboardLayout><div className="text-slate-400">Loading analytics...</div></DashboardLayout>;
    if (!analytics) return <DashboardLayout><div className="text-red-400">Error loading analytics.</div></DashboardLayout>;

    const { fleetMetrics, topVehicles, mostExpensiveVehicle } = analytics;

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Financial Analytics & ROI</h1>
                <p className="text-sm text-slate-400">Fleet profitability and operational expenses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 border border-emerald-500/20">
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-emerald-400">₹{fleetMetrics.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="glass-card p-6 border border-rose-500/20">
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Operational Cost</p>
                    <h3 className="text-3xl font-bold text-rose-400">₹{fleetMetrics.totalOperationalCost.toLocaleString()}</h3>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Net Profit</p>
                    <h3 className={`text-3xl font-bold ${fleetMetrics.netProfitability >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ₹{fleetMetrics.netProfitability.toLocaleString()}
                    </h3>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Avg Fuel Efficiency</p>
                    <h3 className="text-3xl font-bold text-blue-400">{fleetMetrics.avgFuelEfficiency} <span className="text-lg text-slate-500">km/l</span></h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Top Performing Vehicles (Revenue)</h3>
                    <div className="space-y-4">
                        {topVehicles.map((v: any, index: number) => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-medium">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">{v.name}</div>
                                        <div className="text-xs text-slate-500">{v.regNo}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400">₹{v.financials.revenue.toLocaleString()}</div>
                                    <div className="text-xs text-slate-400">{v.performance.totalTrips} Trips</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Cost Analysis - Most Expensive Asset</h3>
                    {mostExpensiveVehicle ? (
                        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h4 className="text-xl font-bold text-white">{mostExpensiveVehicle.name}</h4>
                                    <p className="text-sm text-slate-400">{mostExpensiveVehicle.regNo}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Cost</p>
                                    <p className="text-2xl font-bold text-rose-400">₹{mostExpensiveVehicle.financials.totalExpenses.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Maintenance</span>
                                        <span className="text-slate-300 font-medium">₹{mostExpensiveVehicle.financials.maintenance.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(mostExpensiveVehicle.financials.maintenance / mostExpensiveVehicle.financials.totalExpenses) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Fuel</span>
                                        <span className="text-slate-300 font-medium">₹{mostExpensiveVehicle.financials.fuel.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(mostExpensiveVehicle.financials.fuel / mostExpensiveVehicle.financials.totalExpenses) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Tolls & Other</span>
                                        <span className="text-slate-300 font-medium">₹{(mostExpensiveVehicle.financials.tolls + mostExpensiveVehicle.financials.other).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${((mostExpensiveVehicle.financials.tolls + mostExpensiveVehicle.financials.other) / mostExpensiveVehicle.financials.totalExpenses) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500">No data available.</div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
