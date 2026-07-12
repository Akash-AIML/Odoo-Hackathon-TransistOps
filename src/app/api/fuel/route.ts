// src/app/api/fuel/route.ts - Fuel Management API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { checkFuelAnomaly } from '@/utils/engine';

// 1. GET /api/fuel - List fuel logs with pagination
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;

            const skip = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                prisma.fuelLog.findMany({
                    include: { vehicle: true },
                    skip,
                    take: limit,
                    orderBy: { date: 'desc' },
                }),
                prisma.fuelLog.count(),
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
            console.error('List Fuel Logs Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Financial Analyst'],
);

// 2. POST /api/fuel - Create new Fuel purchase log (Financial Analyst only)
export const POST = withAuth(
    async (req: NextRequest) => {
        try {
            const { vehicleId, date, liters, cost, odometer } = await req.json();

            if (!vehicleId || !date || !liters || !cost || !odometer) {
                return NextResponse.json(
                    { error: 'All fields (vehicleId, date, liters, cost, odometer) are required.' },
                    { status: 400 },
                );
            }

            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            // Check for efficiency anomaly (uses a default 100km distance if not completing a trip)
            const { isAnomaly } = checkFuelAnomaly(vehicle.fuelEfficiency, Number(liters), 100);

            const log = await prisma.fuelLog.create({
                data: {
                    vehicleId,
                    date: new Date(date),
                    liters: Number(liters),
                    cost: Number(cost),
                    odometer: Number(odometer),
                    isAnomaly,
                },
            });

            // Register outflow transaction in financial ledger
            await prisma.transaction.create({
                data: {
                    type: 'OUTFLOW',
                    category: 'Fuel',
                    amount: Number(cost),
                    referenceId: log.id,
                    date: new Date(date),
                },
            });

            return NextResponse.json(log, { status: 201 });
        } catch (error: unknown) {
            console.error('Create Fuel Log Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Financial Analyst'],
);
