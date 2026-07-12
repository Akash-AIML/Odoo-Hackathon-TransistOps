'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function TripsPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/trips?limit=50', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setTrips(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trip Dispatch</h1>
                    <p className="text-sm text-slate-400">Monitor active routes and dispatch vehicles</p>
                </div>
                <button className="btn-primary" onClick={() => alert('Dispatch form would open here')}>
                    Dispatch New Trip
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                <th className="p-4 font-medium">Trip ID</th>
                                <th className="p-4 font-medium">Route</th>
                                <th className="p-4 font-medium">Assignment</th>
                                <th className="p-4 font-medium">Cargo / Dist</th>
                                <th className="p-4 font-medium">ETA</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading trips...</td></tr>
                            ) : trips.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm font-medium text-blue-400">{t.id}</td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-200">{t.source}</div>
                                        <div className="text-xs text-slate-500">↓ {t.destination}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-300">{t.vehicle?.name || <span className="text-amber-500/70">No Vehicle</span>}</div>
                                        <div className="text-xs text-slate-500">{t.driver?.name || <span className="text-amber-500/70">No Driver</span>}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">
                                        <div>{t.cargoWeight} kg</div>
                                        <div className="text-xs text-slate-500">{t.distance} km</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">{t.eta}</td>
                                    <td className="p-4">
                                        <span className={`
                                            ${t.status === 'Completed' ? 'badge-success' : ''}
                                            ${t.status === 'Dispatched' ? 'badge-info' : ''}
                                            ${t.status === 'Draft' || t.status === 'Ready' ? 'badge-warning' : ''}
                                            ${t.status === 'Cancelled' ? 'badge-danger' : ''}
                                        `}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
