'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';
import Link from 'next/link';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/vehicles?limit=50', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setVehicles(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
                    <p className="text-sm text-slate-400">Manage fleet vehicles and documents</p>
                </div>
                <button className="btn-primary" onClick={() => alert('New vehicle form would open here')}>
                    + Add Vehicle
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                <th className="p-4 font-medium">Reg No</th>
                                <th className="p-4 font-medium">Name & Type</th>
                                <th className="p-4 font-medium">Region</th>
                                <th className="p-4 font-medium">Odometer</th>
                                <th className="p-4 font-medium">Health</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading vehicles...</td></tr>
                            ) : vehicles.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm font-medium text-blue-400">
                                        <Link href={`/vehicles/${v.regNo}`}>{v.regNo}</Link>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-200">{v.name}</div>
                                        <div className="text-xs text-slate-500">{v.type} • {v.capacity}kg cap</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">{v.region || 'Central'}</td>
                                    <td className="p-4 text-sm text-slate-300">{v.odometer.toLocaleString()} km</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${v.health >= 80 ? 'bg-emerald-500' : v.health >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${v.health}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-400">{v.health}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`
                                            ${v.status === 'Available' ? 'badge-success' : ''}
                                            ${v.status === 'On Trip' ? 'badge-info' : ''}
                                            ${v.status === 'In Shop' ? 'badge-warning' : ''}
                                            ${v.status === 'Retired' ? 'badge-danger' : ''}
                                        `}>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/vehicles/${v.regNo}`} className="text-xs btn-secondary py-1.5 px-3">View</Link>
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
