'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertBox } from '@/components/ui/AlertBox';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MaintenanceLog, Vehicle } from '@/lib/api/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface MaintenanceManagerProps {
    logs: MaintenanceLog[];
    vehicles: Vehicle[];
    currency: string;
    userRole: string;
}

export function MaintenanceManager({ logs, vehicles, currency, userRole }: MaintenanceManagerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        vehicleId: '',
        serviceType: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        status: 'In Shop',
    });

    const canLog = ['Fleet Manager', 'Maintenance Technician', 'Admin'].includes(userRole);

    async function handleLogService(e: React.FormEvent) {
        e.preventDefault();
        if (!canLog) return;

        setLoading(true);
        setError('');
        setSuccess('');

        const token = document.cookie
            .split('; ')
            .find((c) => c.startsWith('accessToken='))
            ?.split('=')[1];

        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    vehicleId: form.vehicleId,
                    serviceType: form.serviceType,
                    cost: Number(form.cost),
                    date: form.date,
                    status: form.status,
                }),
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Failed to log service record.');
                return;
            }

            setSuccess('Service record logged successfully.');
            setForm({
                vehicleId: '',
                serviceType: '',
                cost: '',
                date: new Date().toISOString().split('T')[0],
                status: 'In Shop',
            });
            router.refresh();
        } catch {
            setError('Request failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteService(logId: string) {
        setActionLoadingId(logId);
        setError('');
        setSuccess('');

        const token = document.cookie
            .split('; ')
            .find((c) => c.startsWith('accessToken='))
            ?.split('=')[1];

        try {
            const res = await fetch(`/api/maintenance/${logId}/close`, {
                method: 'PATCH',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Failed to complete service.');
                return;
            }

            setSuccess('Service marked as completed. Vehicle is now available.');
            router.refresh();
        } catch {
            setError('Request failed.');
        } finally {
            setActionLoadingId(null);
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Log Service Record Form */}
            <div className="lg:col-span-1">
                <div className="rounded-xl border border-card-border bg-card p-5">
                    <h3 className="font-semibold text-lg mb-1">Log Service Record</h3>
                    <p className="text-xs text-muted mb-4">Record repair activities and service maintenance costs</p>

                    {canLog ? (
                        <form onSubmit={handleLogService} className="space-y-4">
                            <div>
                                <label htmlFor="vehicle-select" className="mb-1 block text-sm text-muted">
                                    Vehicle
                                </label>
                                <select
                                    id="vehicle-select"
                                    className="input-field"
                                    value={form.vehicleId}
                                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} ({v.regNo}) — {v.status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="service-type" className="mb-1 block text-sm text-muted">
                                    Service Type
                                </label>
                                <input
                                    id="service-type"
                                    className="input-field"
                                    placeholder="e.g. Oil Change, Engine Repair, Tyres"
                                    value={form.serviceType}
                                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="service-cost" className="mb-1 block text-sm text-muted">
                                        Cost ({currency})
                                    </label>
                                    <input
                                        id="service-cost"
                                        className="input-field"
                                        type="number"
                                        placeholder="Cost"
                                        value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="service-date" className="mb-1 block text-sm text-muted">
                                        Date
                                    </label>
                                    <input
                                        id="service-date"
                                        className="input-field"
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="service-status" className="mb-1 block text-sm text-muted">
                                    Status
                                </label>
                                <select
                                    id="service-status"
                                    className="input-field"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    required
                                >
                                    <option value="In Shop">In Shop</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Upcoming">Upcoming</option>
                                </select>
                            </div>

                            {error && <AlertBox className="text-xs">{error}</AlertBox>}
                            {success && <AlertBox variant="info" className="text-xs">{success}</AlertBox>}

                            <PrimaryButton type="submit" disabled={loading} className="w-full">
                                {loading ? 'Saving...' : 'Save Record'}
                            </PrimaryButton>
                        </form>
                    ) : (
                        <p className="text-sm text-muted bg-card-border/30 rounded-lg p-3 text-center border border-card-border">
                            You do not have permission to log service records.
                        </p>
                    )}
                </div>
            </div>

            {/* Right Column: Service Log Table */}
            <div className="lg:col-span-2">
                <div className="overflow-hidden rounded-xl border border-card-border bg-card">
                    <div className="border-b border-card-border px-4 py-3 bg-card/50">
                        <h3 className="font-semibold">Service Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                                <tr>
                                    <th className="px-4 py-3">Vehicle</th>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Cost</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted">
                                            No maintenance records logged.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-card/85">
                                            <td className="px-4 py-3 font-medium">
                                                {log.vehicle?.name ?? log.vehicleId}
                                            </td>
                                            <td className="px-4 py-3">{log.serviceType}</td>
                                            <td className="px-4 py-3">{formatDate(log.date)}</td>
                                            <td className="px-4 py-3">{formatCurrency(log.cost, currency)}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={log.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {log.status === 'In Shop' && canLog && (
                                                    <PrimaryButton
                                                        onClick={() => handleCompleteService(log.id)}
                                                        disabled={actionLoadingId === log.id}
                                                        variant="ghost"
                                                        className="text-xs py-1 px-2.5 font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                    >
                                                        {actionLoadingId === log.id ? 'Saving...' : 'Complete'}
                                                    </PrimaryButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
