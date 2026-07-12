'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertBox } from '@/components/ui/AlertBox';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Driver, Trip, Vehicle } from '@/lib/api/types';

interface TripDispatcherPanelProps {
    vehicles: Vehicle[];
    drivers: Driver[];
    trips: Trip[];
}

export function TripDispatcherPanel({ vehicles, drivers, trips }: TripDispatcherPanelProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        id: '',
        source: '',
        destination: '',
        cargoWeight: '',
        distance: '',
        vehicleId: '',
        driverId: '',
        revenue: '',
        status: 'Dispatched',
    });

    const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
    const selectedDriver = drivers.find((d) => d.id === form.driverId);

    // Checks
    const isWeightExceeded =
        selectedVehicle && form.cargoWeight ? Number(form.cargoWeight) > selectedVehicle.capacity : false;
    const isLicenseExpired = selectedDriver ? selectedDriver.isLicenseExpired : false;
    const isDriverSuspended = selectedDriver ? selectedDriver.status === 'Suspended' : false;

    const isDispatchBlocked = isWeightExceeded || isLicenseExpired || isDriverSuspended;

    async function handleDispatch(e: React.FormEvent) {
        e.preventDefault();
        if (isDispatchBlocked) return;

        setError('');
        setSuccess('');
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
                    id: form.id || undefined,
                    source: form.source,
                    destination: form.destination,
                    cargoWeight: Number(form.cargoWeight),
                    distance: Number(form.distance),
                    vehicleId: form.vehicleId,
                    driverId: form.driverId,
                    revenue: Number(form.revenue || 0),
                    status: 'Dispatched',
                }),
            });

            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
                setError(data.error ?? 'Dispatch failed.');
                return;
            }

            setSuccess('Trip successfully dispatched!');
            setForm({
                id: '',
                source: '',
                destination: '',
                cargoWeight: '',
                distance: '',
                vehicleId: '',
                driverId: '',
                revenue: '',
                status: 'Dispatched',
            });
            router.refresh();
        } catch {
            setError('Request failed.');
        } finally {
            setLoading(false);
        }
    }

    const liveTrips = trips.filter((t) => ['Draft', 'Ready', 'Dispatched'].includes(t.status)).slice(0, 5);

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'Draft':
                return 1;
            case 'Ready':
                return 2;
            case 'Dispatched':
                return 3;
            case 'Completed':
                return 4;
            default:
                return 0;
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left side: CREATE TRIP */}
            <div className="rounded-xl border border-card-border bg-card p-6 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg mb-1">Create & Dispatch Trip</h3>
                    <p className="text-xs text-muted mb-4">Set up a new cargo transit and assign operational assets</p>

                    <form id="dispatch-form" onSubmit={handleDispatch} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="trip-id" className="mb-1 block text-sm text-muted">
                                    Trip ID (Optional)
                                </label>
                                <input
                                    id="trip-id"
                                    className="input-field"
                                    placeholder="Auto-generated"
                                    value={form.id}
                                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="revenue" className="mb-1 block text-sm text-muted">
                                    Revenue
                                </label>
                                <input
                                    id="revenue"
                                    className="input-field"
                                    type="number"
                                    placeholder="Expected Revenue"
                                    value={form.revenue}
                                    onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="source" className="mb-1 block text-sm text-muted">
                                    Source
                                </label>
                                <input
                                    id="source"
                                    className="input-field"
                                    placeholder="Origin Depot"
                                    value={form.source}
                                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="destination" className="mb-1 block text-sm text-muted">
                                    Destination
                                </label>
                                <input
                                    id="destination"
                                    className="input-field"
                                    placeholder="Destination Hub"
                                    value={form.destination}
                                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="vehicle-select" className="mb-1 block text-sm text-muted">
                                    Vehicle (Available Only)
                                </label>
                                <select
                                    id="vehicle-select"
                                    className="input-field"
                                    value={form.vehicleId}
                                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Vehicle</option>
                                    {vehicles
                                        .filter((v) => v.status === 'Available')
                                        .map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.regNo}) — {v.capacity} kg max
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="driver-select" className="mb-1 block text-sm text-muted">
                                    Driver (Available Only)
                                </label>
                                <select
                                    id="driver-select"
                                    className="input-field"
                                    value={form.driverId}
                                    onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Driver</option>
                                    {drivers
                                        .filter((d) => d.status === 'Available')
                                        .map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name} — {d.category} {d.isLicenseExpired ? '(EXPIRED)' : ''}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="cargo-weight" className="mb-1 block text-sm text-muted">
                                    Cargo Weight (KG)
                                </label>
                                <input
                                    id="cargo-weight"
                                    className="input-field"
                                    type="number"
                                    placeholder="Weight in kg"
                                    value={form.cargoWeight}
                                    onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="distance" className="mb-1 block text-sm text-muted">
                                    Planned Distance (KM)
                                </label>
                                <input
                                    id="distance"
                                    className="input-field"
                                    type="number"
                                    placeholder="Distance in km"
                                    value={form.distance}
                                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error & Warning Blocks */}
                        {isWeightExceeded && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                <p className="font-semibold">⚠️ Dispatch Warning: Capacity Exceeded</p>
                                <p className="mt-0.5">
                                    Vehicle Capacity: {selectedVehicle?.capacity} kg | Cargo Weight: {form.cargoWeight} kg
                                </p>
                                <p className="mt-0.5 text-[11px] opacity-80">
                                    ✖ Cargo exceeds capacity by {Number(form.cargoWeight) - (selectedVehicle?.capacity || 0)} kg - dispatch blocked.
                                </p>
                            </div>
                        )}

                        {isLicenseExpired && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                <p className="font-semibold">⚠️ Dispatch Blocked: License Expired</p>
                                <p className="mt-0.5">Driver license expired. Select a different driver.</p>
                            </div>
                        )}

                        {error && <AlertBox className="text-xs">{error}</AlertBox>}
                        {success && <AlertBox variant="info" className="text-xs">{success}</AlertBox>}
                    </form>
                </div>

                <div className="mt-6 flex gap-3">
                    <PrimaryButton
                        type="submit"
                        form="dispatch-form"
                        disabled={loading || isDispatchBlocked}
                        className="flex-1"
                    >
                        {loading ? 'Dispatching...' : 'Dispatch'}
                    </PrimaryButton>
                    <PrimaryButton
                        variant="ghost"
                        onClick={() => {
                            setForm({
                                id: '',
                                source: '',
                                destination: '',
                                cargoWeight: '',
                                distance: '',
                                vehicleId: '',
                                driverId: '',
                                revenue: '',
                                status: 'Dispatched',
                            });
                            setError('');
                            setSuccess('');
                        }}
                    >
                        Cancel
                    </PrimaryButton>
                </div>
            </div>

            {/* Right side: LIVE BOARD */}
            <div className="rounded-xl border border-card-border bg-card p-6 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg mb-1">Live Board</h3>
                    <p className="text-xs text-muted mb-4">Real-time status updates of active vehicle transits</p>

                    <div className="space-y-5">
                        {liveTrips.length === 0 ? (
                            <p className="text-sm text-muted text-center py-10">No active trips currently in transit.</p>
                        ) : (
                            liveTrips.map((trip) => {
                                const currentStep = getStatusStep(trip.status);
                                const isCancelled = trip.status === 'Cancelled';
                                return (
                                    <div key={trip.id} className="rounded-lg border border-card-border bg-card/40 p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-sm text-primary">{trip.id}</h4>
                                                <p className="text-xs text-muted mt-0.5">
                                                    {trip.source} → {trip.destination}
                                                </p>
                                            </div>
                                            <StatusBadge status={trip.status} />
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-muted">
                                            <span>Veh: {trip.vehicle?.name ?? '—'}</span>
                                            <span>Drv: {trip.driver?.name ?? '—'}</span>
                                            <span>Dist: {trip.distance} km</span>
                                        </div>

                                        {/* Horizontal Stepper Progress */}
                                        {!isCancelled ? (
                                            <div className="relative pt-2 pb-1">
                                                <div className="absolute top-4 left-0 w-full h-[2px] bg-card-border -translate-y-1/2" />
                                                <div
                                                    className="absolute top-4 left-0 h-[2px] bg-primary -translate-y-1/2 transition-all duration-300"
                                                    style={{
                                                        width: `${((currentStep - 1) / 3) * 100}%`,
                                                    }}
                                                />
                                                <div className="relative flex justify-between">
                                                    {['Draft', 'Ready', 'Dispatched', 'Completed'].map((label, idx) => {
                                                        const active = currentStep >= idx + 1;
                                                        return (
                                                            <div key={label} className="flex flex-col items-center">
                                                                <div
                                                                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${
                                                                        active
                                                                            ? 'border-primary bg-primary'
                                                                            : 'border-card-border bg-card'
                                                                    }`}
                                                                />
                                                                <span className="text-[10px] mt-1 text-muted">
                                                                    {label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-red-400 bg-red-500/10 rounded p-2 text-center border border-red-500/20">
                                                Trip cancelled: Operational constraints or vehicle maintenance required.
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
