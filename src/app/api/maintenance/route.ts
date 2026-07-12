// src/app/api/maintenance/route.ts - Maintenance Management API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

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
    async (req: NextRequest) => {
        try {
            const { vehicleId, serviceType, cost, date, status } = await req.json();

            if (!vehicleId || !serviceType || !cost || !date || !status) {
                return NextResponse.json(
                    { error: 'All fields (vehicleId, serviceType, cost, date, status) are required.' },
                    { status: 400 },
                );
            }

            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            // Save log
            const log = await prisma.maintenanceLog.create({
                data: {
                    vehicleId,
                    serviceType,
                    cost: Number(cost),
                    date: new Date(date),
                    status,
                    odometer: vehicle.odometer,
                },
            });

            // Trigger vehicle status cascade
            if (status === 'In Shop') {
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
