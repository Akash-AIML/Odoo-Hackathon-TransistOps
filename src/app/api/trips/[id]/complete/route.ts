// src/app/api/trips/[id]/complete/route.ts - Trip Completion API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const POST = withAuth(
    async (req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { id } = params;
            const { finalOdometer, fuelLiters, fuelCost } = await req.json();

            if (!finalOdometer) {
                return NextResponse.json({ error: 'Final odometer reading is required.' }, { status: 400 });
            }

            const trip = await prisma.trip.findUnique({
                where: { id },
                include: { vehicle: true, driver: true },
            });

            if (!trip) {
                return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
            }

            if (trip.status !== 'Dispatched') {
                return NextResponse.json(
                    { error: 'Only dispatched active trips can be marked as completed.' },
                    { status: 400 },
                );
            }

            // Security check: If role is Driver, they can only complete their own assigned trip
            if (user.role === 'Driver' && trip.driverId !== user.driverId) {
                return NextResponse.json(
                    { error: 'Access Denied. You can only complete trips assigned to you.' },
                    { status: 403 },
                );
            }

            const vehicle = trip.vehicle;
            const driver = trip.driver;

            if (vehicle && Number(finalOdometer) <= vehicle.odometer) {
                return NextResponse.json(
                    {
                        error: `Completion blocked: Final odometer (${finalOdometer} km) must exceed current vehicle odometer (${vehicle.odometer} km).`,
                    },
                    { status: 400 },
                );
            }

            // 1. Log Fuel purchase & Check anomaly
            let fuelAnomalyTriggered = false;
            let dropPercent = 0;
            if (vehicle && fuelLiters && fuelCost) {
                const actualEfficiency = trip.distance / Number(fuelLiters);
                dropPercent = ((vehicle.fuelEfficiency - actualEfficiency) / vehicle.fuelEfficiency) * 100;

                if (dropPercent >= 18.0) {
                    fuelAnomalyTriggered = true;
                }

                const fuelLog = await prisma.fuelLog.create({
                    data: {
                        vehicleId: vehicle.id,
                        date: new Date(),
                        liters: Number(fuelLiters),
                        cost: Number(fuelCost),
                        odometer: Number(finalOdometer),
                        isAnomaly: fuelAnomalyTriggered,
                    },
                });

                // Create financial ledger outflow for fuel purchase
                await prisma.transaction.create({
                    data: {
                        type: 'OUTFLOW',
                        category: 'Fuel',
                        amount: Number(fuelCost),
                        referenceId: fuelLog.id,
                        date: new Date(),
                    },
                });
            }

            // 2. Log Income transaction for trip revenue
            if (trip.revenue > 0) {
                await prisma.transaction.create({
                    data: {
                        type: 'INFLOW',
                        category: 'Trip Revenue',
                        amount: trip.revenue,
                        referenceId: trip.id,
                        date: new Date(),
                    },
                });
            }

            // 3. Update Trip status
            await prisma.trip.update({
                where: { id },
                data: { status: 'Completed', eta: '--' },
            });

            // 4. Update Vehicle state: odometer and status
            if (vehicle) {
                const newOdo = Number(finalOdometer);
                const remainingService = vehicle.nextServiceOdo - newOdo;

                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        odometer: newOdo,
                        status: 'Available',
                        totalTrips: { increment: 1 },
                    },
                });

                // Write alerts if service is due/overdue
                if (remainingService <= 0) {
                    await prisma.notification.create({
                        data: {
                            type: 'Error',
                            message: `🔴 ${vehicle.name} overdue maintenance by ${Math.abs(remainingService)} km`,
                        },
                    });
                } else if (remainingService <= 300) {
                    await prisma.notification.create({
                        data: {
                            type: 'Warning',
                            message: `🟠 ${vehicle.name} requires service inside ${remainingService} km`,
                        },
                    });
                }

                // Flag anomaly notification
                if (fuelAnomalyTriggered) {
                    await prisma.notification.create({
                        data: {
                            type: 'Error',
                            message: `🔴 ${vehicle.name} fuel anomaly detected! Efficiency dropped by ${Math.round(dropPercent)}%`,
                        },
                    });
                }
            }

            // 5. Update Driver state
            if (driver) {
                await prisma.driver.update({
                    where: { id: driver.id },
                    data: {
                        status: 'Available',
                        totalDistance: { increment: trip.distance },
                    },
                });
            }

            // 6. Trip Completed log notification
            await prisma.notification.create({
                data: {
                    type: 'Info',
                    message: `🟢 Trip ${trip.id} completed. Vehicle & Driver returned to pool.`,
                },
            });

            return NextResponse.json({ message: `Trip ${id} completed successfully.` });
        } catch (error: unknown) {
            console.error('Complete Trip Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Dispatcher', 'Driver'],
);
