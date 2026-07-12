// src/app/api/vehicles/[regNo]/route.ts - Vehicle Profile API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { calculateVehicleHealth } from '@/utils/engine';

export const GET = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { regNo } = params;

            const vehicle = await prisma.vehicle.findUnique({
                where: { regNo: regNo.toUpperCase() },
                include: {
                    trips: { orderBy: { createdAt: 'desc' } },
                    maintenanceLogs: { orderBy: { date: 'desc' } },
                    fuelLogs: { orderBy: { date: 'desc' } },
                },
            });

            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            const health = calculateVehicleHealth(vehicle, vehicle.fuelLogs);

            return NextResponse.json({
                ...vehicle,
                health,
            });
        } catch (error: unknown) {
            console.error('Get Vehicle Profile Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Financial Analyst'],
);
