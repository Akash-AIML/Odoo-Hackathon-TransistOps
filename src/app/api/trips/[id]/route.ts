// src/app/api/trips/[id]/route.ts - Trip Detail API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

// GET /api/trips/[id] - Get a single trip with full details
export const GET = withAuth(
    async (_req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const trip = await prisma.trip.findUnique({
                where: { id },
                include: {
                    vehicle: true,
                    driver: true,
                    expenses: { orderBy: { date: 'desc' } },
                    fuelLogs: { orderBy: { date: 'desc' } },
                },
            });

            if (!trip) {
                return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
            }

            // Drivers can only view their own trips
            if (user.role === 'Driver' && trip.driverId !== user.driverId) {
                return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });
            }

            // Compute financials
            const fuelCost = trip.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
            const tollCost = trip.expenses.reduce((sum, e) => sum + e.toll, 0);
            const otherCost = trip.expenses.reduce((sum, e) => sum + e.other, 0);
            const totalExpenses = fuelCost + tollCost + otherCost;
            const profit = trip.revenue - totalExpenses;

            return NextResponse.json({
                ...trip,
                financials: {
                    revenue: trip.revenue,
                    fuelCost,
                    tollCost,
                    otherCost,
                    totalExpenses,
                    profit,
                },
            });
        } catch (error: unknown) {
            console.error('Get Trip Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver'],
);
