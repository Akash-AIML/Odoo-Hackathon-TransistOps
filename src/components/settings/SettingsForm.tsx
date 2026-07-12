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
                setError(data.error ?? 'Failed to save.');
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
            <form onSubmit={handleSave} className="rounded-xl border border-card-border bg-card p-6">
                <h3 className="font-semibold">Profile & Depot Settings</h3>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="user-name" className="mb-1 block text-sm text-muted">
                            Name
                        </label>
                        <input id="user-name" className="input-field" value={user.name} disabled />
                    </div>
                    <div>
                        <label htmlFor="user-email" className="mb-1 block text-sm text-muted">
                            Email
                        </label>
                        <input id="user-email" className="input-field" value={user.email} disabled />
                    </div>
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
                                Speed Limit
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
                            <label htmlFor="currency" className="mb-1 block text-sm text-muted">
                                Currency
                            </label>
                            <input
                                id="currency"
                                className="input-field"
                                value={form.currency}
                                disabled={!canEdit}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            />
                        </div>
                    </div>
                    {error && <AlertBox>{error}</AlertBox>}
                    {message && <AlertBox variant="info">{message}</AlertBox>}
                    {canEdit && (
                        <PrimaryButton type="submit" variant="secondary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    )}
                </div>
            </form>

            <div className="rounded-xl border border-card-border bg-card p-6">
                <h3 className="font-semibold">Notification Preferences</h3>
                <div className="mt-4 space-y-4">
                    {[
                        'Maintenance alerts',
                        'Fuel anomaly warnings',
                        'License expiry reminders',
                        'Trip dispatch confirmations',
                    ].map((label) => (
                        <label key={label} className="flex items-center justify-between text-sm">
                            <span>{label}</span>
                            <input type="checkbox" defaultChecked className="rounded border-card-border" />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
