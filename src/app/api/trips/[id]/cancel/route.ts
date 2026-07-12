// src/app/api/trips/[id]/cancel/route.ts - Trip Cancellation API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { auditLog } from '@/utils/audit';

export const POST = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const trip = await prisma.trip.findUnique({ where: { id } });
            if (!trip) {
                return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
            }

            // Cancel trip
            const updatedTrip = await prisma.trip.update({
                where: { id },
                data: { status: 'Cancelled', eta: '--' },
            });

            await auditLog({
                userId: user.id,
                action: 'CANCEL',
                entity: 'Trip',
                entityId: id,
                oldValue: { status: trip.status },
                newValue: { status: 'Cancelled' },
            });

            // Restore vehicle status
            if (trip.vehicleId) {
                await prisma.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: 'Available' },
                });
            }

            // Restore driver status
            if (trip.driverId) {
                await prisma.driver.update({
                    where: { id: trip.driverId },
                    data: { status: 'Available' },
                });
            }

            // Create alert notification
            await prisma.notification.create({
                data: {
                    type: 'Warning',
                    message: `🟠 Trip ${trip.id} was cancelled.`,
                },
            });

            return NextResponse.json({ message: `Trip ${id} cancelled successfully.` });
        } catch (error: unknown) {
            console.error('Cancel Trip Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Dispatcher', 'Fleet Manager'],
);
