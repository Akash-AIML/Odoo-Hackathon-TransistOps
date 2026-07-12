// src/app/api/vehicles/[regNo]/route.ts - Vehicle Profile, Edit & Retire API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { calculateVehicleHealth } from '@/utils/engine';
import { auditLog } from '@/utils/audit';

// GET /api/vehicles/[regNo] - Get full vehicle profile
export const GET = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { regNo } = params;

            const vehicle = await prisma.vehicle.findUnique({
                where: { regNo: regNo.toUpperCase() },
                include: {
                    trips: { orderBy: { createdAt: 'desc' }, take: 20 },
                    maintenanceLogs: { orderBy: { date: 'desc' }, take: 20 },
                    fuelLogs: { orderBy: { date: 'desc' }, take: 20 },
                    expenses: { orderBy: { date: 'desc' }, take: 20 },
                },
            });

            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            const health = calculateVehicleHealth(vehicle, vehicle.fuelLogs);

            return NextResponse.json({ ...vehicle, health });
        } catch (error: unknown) {
            console.error('Get Vehicle Profile Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Financial Analyst', 'Safety Officer'],
);

// PATCH /api/vehicles/[regNo] - Edit vehicle details (Fleet Manager only)
export const PATCH = withAuth(
    async (req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { regNo } = params;

            const vehicle = await prisma.vehicle.findUnique({ where: { regNo: regNo.toUpperCase() } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            // Business rule: Retired vehicles cannot be edited
            if (vehicle.status === 'Retired') {
                return NextResponse.json(
                    { error: 'Retired vehicles cannot be edited.' },
                    { status: 400 },
                );
            }

            const body = await req.json();
            const allowedFields = [
                'name', 'type', 'capacity', 'odometer', 'cost', 'status',
                'region', 'insuranceExpiry', 'pollutionExpiry', 'documents',
                'nextServiceOdo', 'fuelEfficiency'
            ];

            const updateData: Record<string, unknown> = {};
            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    if (field === 'insuranceExpiry' || field === 'pollutionExpiry') {
                        updateData[field] = body[field] ? new Date(body[field]) : null;
                    } else if (field === 'capacity' || field === 'odometer' || field === 'cost' || field === 'nextServiceOdo') {
                        updateData[field] = Number(body[field]);
                    } else if (field === 'fuelEfficiency') {
                        updateData[field] = parseFloat(body[field]);
                    } else {
                        updateData[field] = body[field];
                    }
                }
            }

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
            }

            const updated = await prisma.vehicle.update({
                where: { regNo: regNo.toUpperCase() },
                data: updateData,
            });

            await auditLog({
                userId: user.id,
                action: 'UPDATE',
                entity: 'Vehicle',
                entityId: vehicle.id,
                oldValue: vehicle,
                newValue: updated,
            });

            return NextResponse.json(updated);
        } catch (error: unknown) {
            console.error('Update Vehicle Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager'],
);

// DELETE /api/vehicles/[regNo] - Retire a vehicle (Fleet Manager only)
export const DELETE = withAuth(
    async (_req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { regNo } = params;

            const vehicle = await prisma.vehicle.findUnique({ where: { regNo: regNo.toUpperCase() } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            if (vehicle.status === 'Retired') {
                return NextResponse.json({ error: 'Vehicle is already retired.' }, { status: 400 });
            }

            // Cannot retire if currently on trip or in shop
            if (vehicle.status === 'On Trip') {
                return NextResponse.json(
                    { error: 'Cannot retire a vehicle currently on an active trip.' },
                    { status: 400 },
                );
            }

            const updated = await prisma.vehicle.update({
                where: { regNo: regNo.toUpperCase() },
                data: { status: 'Retired', health: 0 },
            });

            await auditLog({
                userId: user.id,
                action: 'DELETE',
                entity: 'Vehicle',
                entityId: vehicle.id,
                oldValue: { status: vehicle.status },
                newValue: { status: 'Retired' },
            });

            await prisma.notification.create({
                data: {
                    type: 'Warning',
                    message: `🟠 Vehicle ${vehicle.name} (${vehicle.regNo}) has been retired.`,
                },
            });

            return NextResponse.json(updated);
        } catch (error: unknown) {
            console.error('Retire Vehicle Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager'],
);
