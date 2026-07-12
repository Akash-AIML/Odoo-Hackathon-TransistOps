'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertBox } from '@/components/ui/AlertBox';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { Settings, User } from '@/lib/api/types';

interface SettingsFormProps {
    settings: Settings;
    user: User;
}

export function SettingsForm({ settings, user }: SettingsFormProps) {
    const router = useRouter();
    const [form, setForm] = useState(settings);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const canEdit = user.role === 'Fleet Manager' || user.role === 'Admin';

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!canEdit) return;

        setLoading(true);
        setError('');
        setMessage('');

        const token = document.cookie
            .split('; ')
            .find((c) => c.startsWith('accessToken='))
            ?.split('=')[1];

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(form),
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Failed to save settings.');
                return;
            }

            setMessage('Changes saved successfully.');
            router.refresh();
        } catch {
            setError('Request failed.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleSave} className="rounded-xl border border-card-border bg-card p-6 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg">General Settings</h3>
                    <p className="text-xs text-muted mb-4">Configure depot name, speed limits, and distance units</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="depot-name" className="mb-1 block text-sm text-muted">
                                Depot Name
                            </label>
                            <input
                                id="depot-name"
                                className="input-field"
                                value={form.depotName}
                                disabled={!canEdit}
                                onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="speed-limit" className="mb-1 block text-sm text-muted">
                                    Safe Speed Limit (KM/H)
                                </label>
                                <input
                                    id="speed-limit"
                                    className="input-field"
                                    type="number"
                                    value={form.safeSpeedLimit}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, safeSpeedLimit: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label htmlFor="distance-unit" className="mb-1 block text-sm text-muted">
                                    Distance Unit
                                </label>
                                <select
                                    id="distance-unit"
                                    className="input-field"
                                    value={form.distanceUnit}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, distanceUnit: e.target.value })}
                                >
                                    <option value="Kilometers">Kilometers</option>
                                    <option value="Miles">Miles</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {error && <AlertBox>{error}</AlertBox>}
                    {message && <AlertBox variant="info">{message}</AlertBox>}
                    {canEdit && (
                        <PrimaryButton type="submit" variant="secondary" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    )}
                </div>
            </form>

            <div className="rounded-xl border border-card-border bg-card p-6">
                <h3 className="font-semibold text-lg">Role-Based Access (RBAC)</h3>
                <p className="text-xs text-muted mb-4">Current privilege matrices defined by organization rules</p>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="border-b border-card-border bg-card/50 text-xs uppercase text-muted">
                            <tr>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-center">Fleet</th>
                                <th className="px-3 py-2 text-center">Drivers</th>
                                <th className="px-3 py-2 text-center">Trips</th>
                                <th className="px-3 py-2 text-center">Fuel/Exp.</th>
                                <th className="px-3 py-2 text-center">Analytics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border text-xs">
                            <tr className="hover:bg-card/85">
                                <td className="px-3 py-3 font-medium">Fleet Manager</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                            </tr>
                            <tr className="hover:bg-card/85">
                                <td className="px-3 py-3 font-medium">Dispatcher</td>
                                <td className="px-3 py-3 text-center text-blue-400">view</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                            </tr>
                            <tr className="hover:bg-card/85">
                                <td className="px-3 py-3 font-medium">Safety Officer</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-blue-400">view</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                            </tr>
                            <tr className="hover:bg-card/85">
                                <td className="px-3 py-3 font-medium">Financial Analyst</td>
                                <td className="px-3 py-3 text-center text-blue-400">view</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-muted">—</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                                <td className="px-3 py-3 text-center text-emerald-400 font-bold">✓</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
