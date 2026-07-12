// src/app/api/vehicles/route.ts - Vehicle Management API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { calculateVehicleHealth } from '@/utils/engine';

// 1. GET /api/vehicles - List vehicles with pagination, search, and filtering
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const search = searchParams.get('search') || undefined;
            const type = searchParams.get('type') || undefined;
            const status = searchParams.get('status') || undefined;
            const sortBy = searchParams.get('sortBy') || 'createdAt';
            const sortOrder = searchParams.get('sortOrder') || 'desc';

            const skip = (page - 1) * limit;

            // Build filtering query
            const where: {
                type?: string;
                status?: string;
                OR?: Array<{ regNo: { contains: string } } | { name: { contains: string } }>;
            } = {};
            if (type) where.type = type;
            if (status) where.status = status;
            if (search) {
                where.OR = [{ regNo: { contains: search } }, { name: { contains: search } }];
            }

            const [vehicles, total] = await Promise.all([
                prisma.vehicle.findMany({
                    where,
                    include: { fuelLogs: true },
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                }),
                prisma.vehicle.count({ where }),
            ]);

            // Dynamically compute health for each vehicle
            const vehiclesWithHealth = vehicles.map((v) => ({
                ...v,
                health: calculateVehicleHealth(v, v.fuelLogs),
            }));

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: vehiclesWithHealth,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Vehicles Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Financial Analyst'],
);

// 2. POST /api/vehicles - Create a new Vehicle (Fleet Manager only)
export const POST = withAuth(
    async (req: NextRequest) => {
        try {
            const { regNo, name, type, capacity, odometer, cost } = await req.json();

            if (!regNo || !name || !type || !capacity || !odometer || !cost) {
                return NextResponse.json(
                    { error: 'All fields (regNo, name, type, capacity, odometer, cost) are required.' },
                    { status: 400 },
                );
            }

            const formattedRegNo = regNo.toUpperCase().trim();
            const exists = await prisma.vehicle.findUnique({ where: { regNo: formattedRegNo } });
            if (exists) {
                return NextResponse.json(
                    { error: `Vehicle registration number ${formattedRegNo} is already registered.` },
                    { status: 400 },
                );
            }

            // Default documents status
            const docsDefault = JSON.stringify([
                { name: 'Insurance', status: 'Valid', expiry: getRelativeDateString(365) },
                { name: 'RC', status: 'Valid', expiry: getRelativeDateString(1000) },
                { name: 'Fitness', status: 'Valid', expiry: getRelativeDateString(180) },
            ]);

            const newVehicle = await prisma.vehicle.create({
                data: {
                    regNo: formattedRegNo,
                    name: name.trim(),
                    type,
                    capacity: Number(capacity),
                    odometer: Number(odometer),
                    cost: Number(cost),
                    status: 'Available',
                    nextServiceOdo: Number(odometer) + 5000,
                    documents: docsDefault,
                },
            });

            return NextResponse.json(newVehicle, { status: 201 });
        } catch (error: unknown) {
            console.error('Create Vehicle Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager'],
);

function getRelativeDateString(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}
