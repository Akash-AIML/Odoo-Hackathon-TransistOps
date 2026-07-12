// src/app/api/settings/route.ts - Depot Settings API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

// 1. GET /api/settings - Read system settings
export const GET = withAuth(
    async (_req: NextRequest) => {
        try {
            const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
            return NextResponse.json(settings);
        } catch (error: unknown) {
            console.error('Get Settings Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver', 'Maintenance Technician'],
);

// 2. PUT /api/settings - Update system settings (Fleet Manager only)
export const PUT = withAuth(
    async (req: NextRequest) => {
        try {
            const { depotName, safeSpeedLimit, distanceUnit, currency } = await req.json();

            const updated = await prisma.settings.update({
                where: { id: 'default' },
                data: {
                    depotName,
                    safeSpeedLimit: Number(safeSpeedLimit),
                    distanceUnit,
                    currency,
                },
            });

            return NextResponse.json(updated);
        } catch (error: unknown) {
            console.error('Update Settings Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager'],
);
