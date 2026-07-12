'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const role = localStorage.getItem('transitops_demo_role') || '';
                const res = await fetch('/api/dashboard', { // Reusing dashboard endpoint which includes alerts
                    headers: { 'X-Demo-Role': role }
                });
                const json = await res.json();
                setNotifications(json.alerts || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Alerts</h1>
                    <p className="text-sm text-slate-400">Notifications, dispatch events, and system warnings</p>
                </div>
                <button className="btn-secondary" onClick={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))}>
                    Mark All Read
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="divide-y divide-slate-800/50">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading alerts...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No alerts generated yet.</div>
                    ) : notifications.map((n) => (
                        <div key={n.id} className={`p-4 transition-colors ${!n.isRead ? 'bg-blue-900/10' : 'hover:bg-slate-800/30'}`}>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1">
                                    {n.type === 'Error' && <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">⚠️</div>}
                                    {n.type === 'Warning' && <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">⚡</div>}
                                    {n.type === 'Info' && <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">ℹ️</div>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-slate-300'}`}>
                                            {n.message}
                                        </p>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                                            {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    {!n.isRead && (
                                        <button 
                                            onClick={() => markAsRead(n.id)}
                                            className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-medium"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
