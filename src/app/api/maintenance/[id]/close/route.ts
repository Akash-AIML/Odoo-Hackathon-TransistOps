// src/app/api/maintenance/[id]/close/route.ts - Close Maintenance Log API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const PATCH = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const log = await prisma.maintenanceLog.findUnique({ where: { id } });
            if (!log) {
                return NextResponse.json({ error: 'Service log not found.' }, { status: 404 });
            }

            // Close maintenance log
            await prisma.maintenanceLog.update({
                where: { id },
                data: { status: 'Completed' },
            });

            // Set vehicle back to Available and increment its next service odometer
            const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });
            if (vehicle) {
                const nextService = vehicle.odometer + 5000;
                const newStatus = vehicle.status === 'Retired' ? 'Retired' : 'Available';

                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        status: newStatus,
                        nextServiceOdo: nextService,
                    },
                });
            }

            return NextResponse.json({ message: 'Service log completed. Vehicle status restored.' });
        } catch (error: unknown) {
            console.error('Close Maintenance Log Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Maintenance Technician'],
);
