'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function DriversPage() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/reports/drivers', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setDrivers(json.drivers || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Driver Management</h1>
                    <p className="text-sm text-slate-400">Manage personnel, licenses, and compliance</p>
                </div>
                <button className="btn-primary" onClick={() => alert('New driver form would open here')}>
                    + Add Driver
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">License / Category</th>
                                <th className="p-4 font-medium">Experience</th>
                                <th className="p-4 font-medium">Safety Score</th>
                                <th className="p-4 font-medium">Compliance</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading drivers...</td></tr>
                            ) : drivers.map((d) => (
                                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-medium text-slate-200">{d.name}</td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-300">{d.licenseNo}</div>
                                        <div className="text-xs text-slate-500">{d.category}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">{d.experience} Years</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${
                                                d.safetyScore >= 90 ? 'text-emerald-400' : 
                                                d.safetyScore >= 75 ? 'text-amber-400' : 'text-red-400'
                                            }`}>{d.safetyScore}/100</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            d.complianceBadge === 'Compliant' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                            d.complianceBadge === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {d.complianceBadge}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`
                                            ${d.status === 'Available' ? 'badge-success' : ''}
                                            ${d.status === 'On Trip' ? 'badge-info' : ''}
                                            ${d.status === 'Suspended' ? 'badge-danger' : ''}
                                            ${d.status === 'Off Duty' ? 'badge-neutral' : ''}
                                        `}>
                                            {d.status}
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
