// src/app/api/maintenance/route.ts - Maintenance Management API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { auditLog } from '@/utils/audit';

// 1. GET /api/maintenance - List logs with pagination
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const status = searchParams.get('status') || undefined;

            const skip = (page - 1) * limit;
            const where = status ? { status } : {};

            const [logs, total] = await Promise.all([
                prisma.maintenanceLog.findMany({
                    where,
                    include: { vehicle: true },
                    skip,
                    take: limit,
                    orderBy: { date: 'desc' },
                }),
                prisma.maintenanceLog.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Maintenance Logs Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Maintenance Technician'],
);

// 2. POST /api/maintenance - Create new log (Fleet Manager or Maintenance Technician)
export const POST = withAuth(
    async (req: NextRequest, { user }: AuthenticatedContext) => {
        try {
            const { vehicleId, serviceType, priority, mechanic, cost, date, status, notes } = await req.json();

            if (!vehicleId || !serviceType || !cost || !date || !status) {
                return NextResponse.json(
                    { error: 'Required fields: vehicleId, serviceType, cost, date, status.' },
                    { status: 400 },
                );
            }

            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            if (vehicle.status === 'Retired') {
                return NextResponse.json(
                    { error: 'Retired vehicles cannot be scheduled for maintenance.' },
                    { status: 400 },
                );
            }

            // Save log
            const log = await prisma.maintenanceLog.create({
                data: {
                    vehicleId,
                    serviceType,
                    priority: priority || 'Normal',
                    mechanic: mechanic || '',
                    cost: Number(cost),
                    date: new Date(date),
                    status,
                    notes: notes || '',
                    odometer: vehicle.odometer,
                },
            });

            await auditLog({
                userId: user.id,
                action: 'CREATE',
                entity: 'MaintenanceLog',
                entityId: log.id,
                newValue: log,
            });

            // Trigger vehicle status cascade
            if (status === 'In Shop' || status === 'In Progress') {
                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: { status: 'In Shop' },
                });
            }

            // Create financial ledger outflow for maintenance
            await prisma.transaction.create({
                data: {
                    type: 'OUTFLOW',
                    category: 'Maintenance',
                    amount: Number(cost),
                    referenceId: log.id,
                    date: new Date(date),
                },
            });

            return NextResponse.json(log, { status: 201 });
        } catch (error: unknown) {
            console.error('Create Maintenance Log Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Maintenance Technician'],
);
