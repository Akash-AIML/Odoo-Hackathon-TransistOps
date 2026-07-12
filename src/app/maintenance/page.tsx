'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function MaintenancePage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/maintenance?limit=50', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setLogs(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Maintenance Workflow</h1>
                    <p className="text-sm text-slate-400">Track services, repairs, and inspections</p>
                </div>
                <button className="btn-primary" onClick={() => alert('Maintenance form would open here')}>
                    Log Service
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Vehicle</th>
                                <th className="p-4 font-medium">Service Type</th>
                                <th className="p-4 font-medium">Priority / Mechanic</th>
                                <th className="p-4 font-medium">Cost</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading maintenance logs...</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm text-slate-300">
                                        {new Date(log.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-200">{log.vehicle?.name}</div>
                                        <div className="text-xs text-slate-500">{log.vehicle?.regNo}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">{log.serviceType}</td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            {log.priority === 'High' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                            {log.priority === 'Normal' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                            {log.priority === 'Low' && <div className="w-2 h-2 rounded-full bg-slate-500"></div>}
                                            {log.priority || 'Normal'}
                                        </div>
                                        <div className="text-xs text-slate-500">{log.mechanic || 'Unassigned'}</div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-rose-400">₹{log.cost.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`
                                            ${log.status === 'Completed' ? 'badge-success' : ''}
                                            ${log.status === 'In Progress' || log.status === 'In Shop' ? 'badge-warning' : ''}
                                            ${log.status === 'Scheduled' ? 'badge-info' : ''}
                                        `}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No maintenance records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
