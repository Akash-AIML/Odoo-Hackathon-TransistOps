'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertBox } from '@/components/ui/AlertBox';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VEHICLE_TYPES } from '@/lib/constants';

export function AddVehicleForm() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const body = {
            regNo: form.get('regNo'),
            name: form.get('name'),
            type: form.get('type'),
            capacity: form.get('capacity'),
            odometer: form.get('odometer'),
            cost: form.get('cost'),
        };

        try {
            const token = document.cookie
                .split('; ')
                .find((c) => c.startsWith('accessToken='))
                ?.split('=')[1];

            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Failed to create vehicle.');
                return;
            }

            setOpen(false);
            router.refresh();
        } catch {
            setError('Request failed.');
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <PrimaryButton onClick={() => setOpen(true)} size="md">
                Add Vehicle
            </PrimaryButton>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-card-border bg-card p-6">
                <h2 className="text-lg font-bold">Add Vehicle</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {error && <AlertBox>{error}</AlertBox>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <input name="regNo" required placeholder="Registration No" className="input-field" />
                        <input name="name" required placeholder="Vehicle Name" className="input-field" />
                        <select name="type" required className="input-field">
                            {VEHICLE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <input
                            name="capacity"
                            type="number"
                            required
                            placeholder="Capacity (kg)"
                            className="input-field"
                        />
                        <input
                            name="odometer"
                            type="number"
                            required
                            placeholder="Odometer (km)"
                            className="input-field"
                        />
                        <input
                            name="cost"
                            type="number"
                            required
                            placeholder="Acquisition Cost (paise)"
                            className="input-field"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <PrimaryButton variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
