'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AlertBox } from '@/components/ui/AlertBox';
import type { Driver, Vehicle } from '@/lib/api/types';

interface TripWizardProps {
    vehicles: Vehicle[];
    drivers: Driver[];
}

export function TripWizard({ vehicles, drivers }: TripWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        id: '',
        source: '',
        destination: '',
        cargoWeight: '',
        distance: '',
        vehicleId: '',
        driverId: '',
        revenue: '',
        status: 'Draft',
    });

    const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
    const selectedDriver = drivers.find((d) => d.id === form.driverId);
    const overCapacity =
        selectedVehicle && form.cargoWeight
            ? Number(form.cargoWeight) > selectedVehicle.capacity
            : false;

    async function handleFinish() {
        setError('');
        setLoading(true);

        const token = document.cookie
            .split('; ')
            .find((c) => c.startsWith('accessToken='))
            ?.split('=')[1];

        try {
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    ...form,
                    cargoWeight: Number(form.cargoWeight),
                    distance: Number(form.distance),
                    revenue: Number(form.revenue || 0),
                    status: 'Dispatched',
                }),
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Dispatch failed.');
                return;
            }

            router.refresh();
            setStep(1);
            setForm({
                id: '',
                source: '',
                destination: '',
                cargoWeight: '',
                distance: '',
                vehicleId: '',
                driverId: '',
                revenue: '',
                status: 'Draft',
            });
        } catch {
            setError('Request failed.');
        } finally {
            setLoading(false);
        }
    }

    const steps = ['Trip Info', 'Assign Driver', 'Assign Vehicle', 'Review'];

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <div className="mb-6 flex gap-2">
                    {steps.map((label, i) => (
                        <div
                            key={label}
                            className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                                step === i + 1
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-card-border text-muted'
                            }`}
                        >
                            {i + 1}. {label}
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-card-border bg-card p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <input
                                className="input-field"
                                placeholder="Trip ID (optional)"
                                value={form.id}
                                onChange={(e) => setForm({ ...form, id: e.target.value })}
                            />
                            <input
                                className="input-field"
                                placeholder="Source"
                                value={form.source}
                                onChange={(e) => setForm({ ...form, source: e.target.value })}
                            />
                            <input
                                className="input-field"
                                placeholder="Destination"
                                value={form.destination}
                                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                    className="input-field"
                                    type="number"
                                    placeholder="Cargo Weight (kg)"
                                    value={form.cargoWeight}
                                    onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
                                />
                                <input
                                    className="input-field"
                                    type="number"
                                    placeholder="Distance (km)"
                                    value={form.distance}
                                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <select
                            className="input-field"
                            value={form.driverId}
                            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                        >
                            <option value="">Select Driver</option>
                            {drivers
                                .filter((d) => d.status === 'Available')
                                .map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} — {d.category}
                                    </option>
                                ))}
                        </select>
                    )}

                    {step === 3 && (
                        <select
                            className="input-field"
                            value={form.vehicleId}
                            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles
                                .filter((v) => v.status === 'Available')
                                .map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name} ({v.regNo}) — {v.capacity} kg
                                    </option>
                                ))}
                        </select>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <input
                                className="input-field"
                                type="number"
                                placeholder="Revenue (paise)"
                                value={form.revenue}
                                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                            />
                            {overCapacity && (
                                <AlertBox>
                                    Cargo weight ({form.cargoWeight} kg) exceeds vehicle capacity (
                                    {selectedVehicle?.capacity} kg).
                                </AlertBox>
                            )}
                            {error && <AlertBox>{error}</AlertBox>}
                        </div>
                    )}

                    <div className="mt-6 flex justify-between">
                        <PrimaryButton
                            variant="ghost"
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                        >
                            Back
                        </PrimaryButton>
                        {step < 4 ? (
                            <PrimaryButton onClick={() => setStep(step + 1)}>Next</PrimaryButton>
                        ) : (
                            <PrimaryButton onClick={handleFinish} disabled={loading || overCapacity}>
                                {loading ? 'Dispatching...' : 'Finish'}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5">
                <h3 className="font-semibold">Trip Summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                    <div>
                        <dt className="text-muted">Route</dt>
                        <dd>
                            {form.source || '—'} → {form.destination || '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted">Cargo</dt>
                        <dd>{form.cargoWeight ? `${form.cargoWeight} kg` : '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-muted">Driver</dt>
                        <dd>{selectedDriver?.name ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-muted">Vehicle</dt>
                        <dd>{selectedVehicle ? `${selectedVehicle.name} (${selectedVehicle.regNo})` : '—'}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
