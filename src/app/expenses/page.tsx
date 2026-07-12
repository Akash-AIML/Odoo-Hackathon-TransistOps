'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/expenses?limit=50', {
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setExpenses(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Expense Tracker</h1>
                    <p className="text-sm text-slate-400">Manage tolls, parking, and miscellaneous operational costs</p>
                </div>
                <button className="btn-primary" onClick={() => alert('New expense form would open here')}>
                    Record Expense
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Description</th>
                                <th className="p-4 font-medium">Vehicle / Trip</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading expenses...</td></tr>
                            ) : expenses.map((e) => (
                                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-sm text-slate-300">
                                        {new Date(e.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            e.category === 'Toll' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                        }`}>
                                            {e.category || (e.toll > 0 ? 'Toll' : 'Other')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">{e.description || '-'}</td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-200">{e.vehicle?.name || '-'}</div>
                                        {e.tripId && <div className="text-xs text-slate-500">Trip: {e.tripId}</div>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-sm font-bold text-rose-400">
                                            ₹{e.amount > 0 ? e.amount.toLocaleString() : (e.toll + e.other).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No expenses recorded yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
