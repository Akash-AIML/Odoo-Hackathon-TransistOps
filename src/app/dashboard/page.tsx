'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
    metrics: {
        fleetHealth: number;
        fleetUtilization: number;
        driversAvailable: number;
        maintenanceAlerts: number;
        todayTrips: number;
        activeTrips: number;
        pendingTrips: number;
        todayFuelCost: number;
        monthlyOperationalCost: number;
    };
    statusCounts: {
        Available: number;
        OnTrip: number;
        InShop: number;
        Retired: number;
    };
    recentTrips: any[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/dashboard', {
                    headers: { 'X-Demo-Role': role }
                });
                if (!res.ok) throw new Error('Failed to load dashboard data');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-800 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-slate-800 rounded"></div><div className="h-4 bg-slate-800 rounded w-5/6"></div></div></div></div>;
    if (error) return <div className="text-red-400 glass-card p-6 border-red-500/20">{error}</div>;
    if (!data) return null;

    const { metrics, statusCounts, recentTrips } = data;

    // Determine colors for health score
    const healthColor = metrics.fleetHealth >= 80 ? 'text-emerald-400' : metrics.fleetHealth >= 60 ? 'text-amber-400' : 'text-red-400';
    const utilColor = metrics.fleetUtilization >= 70 ? 'text-emerald-400' : metrics.fleetUtilization >= 40 ? 'text-blue-400' : 'text-amber-400';

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            
            {/* KPI Row 1 - Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Active Trips</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white">{metrics.activeTrips}</h3>
                        <span className="badge-success">In Progress</span>
                    </div>
                </div>
                
                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Pending Dispatches</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white">{metrics.pendingTrips}</h3>
                        {metrics.pendingTrips > 0 ? <span className="badge-warning">Action Req</span> : <span className="badge-neutral">Clear</span>}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Fleet Health Score</p>
                    <div className="flex items-end justify-between">
                        <h3 className={`text-3xl font-bold ${healthColor}`}>{metrics.fleetHealth}%</h3>
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-current" style={{ width: `${metrics.fleetHealth}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Available Drivers</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white">{metrics.driversAvailable}</h3>
                        <span className="badge-info">Ready</span>
                    </div>
                </div>
            </div>

            {/* KPI Row 2 - Financials & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 col-span-1 md:col-span-2">
                    <p className="text-sm font-medium text-slate-400 mb-1">Vehicle Status Distribution</p>
                    <div className="flex h-4 bg-slate-800 rounded-full overflow-hidden mt-4 mb-2">
                        <div className="bg-emerald-500" style={{ width: `${(statusCounts.Available / Math.max(1, statusCounts.Available + statusCounts.OnTrip + statusCounts.InShop)) * 100}%` }} title={`Available: ${statusCounts.Available}`}></div>
                        <div className="bg-blue-500" style={{ width: `${(statusCounts.OnTrip / Math.max(1, statusCounts.Available + statusCounts.OnTrip + statusCounts.InShop)) * 100}%` }} title={`On Trip: ${statusCounts.OnTrip}`}></div>
                        <div className="bg-amber-500" style={{ width: `${(statusCounts.InShop / Math.max(1, statusCounts.Available + statusCounts.OnTrip + statusCounts.InShop)) * 100}%` }} title={`In Shop: ${statusCounts.InShop}`}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 px-1">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Available ({statusCounts.Available})</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> On Trip ({statusCounts.OnTrip})</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> In Shop ({statusCounts.InShop})</span>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <p className="text-sm font-medium text-slate-400 mb-1">Today's Fuel Cost</p>
                    <h3 className="text-2xl font-bold text-rose-400 mt-2">₹{(metrics.todayFuelCost).toLocaleString()}</h3>
                </div>

                <div className="glass-card p-6 border border-amber-500/30">
                    <p className="text-sm font-medium text-amber-500/80 mb-1">Maintenance Alerts</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-amber-500">{metrics.maintenanceAlerts}</h3>
                        <span className="text-xs text-slate-400 mb-1">Vehicles need service</span>
                    </div>
                </div>
            </div>

            {/* Charts & Lists Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Trips Table */}
                <div className="glass-card p-0 col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-white">Recent Trips</h3>
                        <a href="/trips" className="text-sm text-blue-400 hover:text-blue-300">View All</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                    <th className="p-4 font-medium">Trip ID</th>
                                    <th className="p-4 font-medium">Route</th>
                                    <th className="p-4 font-medium">Vehicle</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {recentTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-300">{trip.id}</td>
                                        <td className="p-4 text-sm text-slate-400">
                                            <div className="truncate max-w-[200px]">{trip.source} → {trip.destination}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">{trip.vehicle?.name || '-'}</td>
                                        <td className="p-4">
                                            <span className={`
                                                ${trip.status === 'Completed' ? 'badge-success' : ''}
                                                ${trip.status === 'Dispatched' ? 'badge-info' : ''}
                                                ${trip.status === 'Draft' || trip.status === 'Ready' ? 'badge-warning' : ''}
                                                ${trip.status === 'Cancelled' ? 'badge-danger' : ''}
                                            `}>
                                                {trip.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentTrips.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No recent trips found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monthly Cost Summary */}
                <div className="glass-card p-6 flex flex-col">
                    <h3 className="text-lg font-medium text-white mb-6">30-Day OpEx</h3>
                    
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <p className="text-sm text-slate-400 mb-2">Total Estimated Outflow</p>
                            <h2 className="text-4xl font-bold text-white tracking-tight">₹{(metrics.monthlyOperationalCost).toLocaleString()}</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-slate-300">Fuel & Energy</span>
                                    <span className="text-slate-400">~65%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-rose-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-slate-300">Maintenance</span>
                                    <span className="text-slate-400">~25%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-amber-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-slate-300">Tolls & Other</span>
                                    <span className="text-slate-400">~10%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-slate-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
