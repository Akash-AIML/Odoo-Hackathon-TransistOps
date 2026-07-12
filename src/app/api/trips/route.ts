// src/app/api/trips/route.ts - Trip Dispatch & Listing API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

// 1. GET /api/trips - List trips with pagination (Filtered for Driver role)
export const GET = withAuth(
    async (req: NextRequest, { user }: AuthenticatedContext) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const status = searchParams.get('status') || undefined;

            const skip = (page - 1) * limit;

            // Define filters. If role is Driver, force filter to their own driver ID
            const where: { status?: string; driverId?: string } = {};
            if (status) where.status = status;
            if (user.role === 'Driver') {
                if (!user.driverId) {
                    return NextResponse.json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
                }
                where.driverId = user.driverId;
            }

            const [trips, total] = await Promise.all([
                prisma.trip.findMany({
                    where,
                    include: { vehicle: true, driver: true },
                    skip,
                    take: limit,
                    orderBy: { id: 'desc' },
                }),
                prisma.trip.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: trips,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Trips Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Driver'],
);

// 2. POST /api/trips - Create/Dispatch a Trip (Dispatcher only)
export const POST = withAuth(
    async (req: NextRequest) => {
        try {
            const { id, source, destination, cargoWeight, distance, vehicleId, driverId, status, revenue } =
                await req.json();

            if (!source || !destination || !cargoWeight || !distance) {
                return NextResponse.json(
                    { error: 'Source, destination, cargo weight, and distance are required.' },
                    { status: 400 },
                );
            }

            const finalId = id || `TR-${String(Math.floor(100 + Math.random() * 900))}`;

            // Check if ID is unique
            const existingTrip = await prisma.trip.findUnique({ where: { id: finalId } });
            if (existingTrip) {
                return NextResponse.json({ error: `Trip with ID ${finalId} already exists.` }, { status: 400 });
            }

            const vehicle = vehicleId ? await prisma.vehicle.findUnique({ where: { id: vehicleId } }) : null;
            const driver = driverId ? await prisma.driver.findUnique({ where: { id: driverId } }) : null;

            // Dispatch compliance rules
            if (status === 'Dispatched') {
                if (!vehicle)
                    return NextResponse.json(
                        { error: 'A vehicle assignment is required for dispatched trips.' },
                        { status: 400 },
                    );
                if (!driver)
                    return NextResponse.json(
                        { error: 'A driver assignment is required for dispatched trips.' },
                        { status: 400 },
                    );

                // Compliance Checks
                if (vehicle.status !== 'Available') {
                    return NextResponse.json(
                        { error: `Vehicle ${vehicle.name} is currently ${vehicle.status} and cannot be dispatched.` },
                        { status: 400 },
                    );
                }
                if (driver.status !== 'Available') {
                    return NextResponse.json(
                        { error: `Driver ${driver.name} is currently ${driver.status} and cannot be assigned.` },
                        { status: 400 },
                    );
                }
                if (new Date(driver.expiryDate) < new Date()) {
                    return NextResponse.json(
                        { error: 'Dispatch Blocked: Driver license has expired.' },
                        { status: 400 },
                    );
                }
                if (Number(cargoWeight) > vehicle.capacity) {
                    return NextResponse.json(
                        {
                            error: `Dispatch Blocked: Cargo weight (${cargoWeight} kg) exceeds vehicle load capacity (${vehicle.capacity} kg).`,
                        },
                        { status: 400 },
                    );
                }
            }

            // Save Trip
            const newTrip = await prisma.trip.create({
                data: {
                    id: finalId,
                    source,
                    destination,
                    cargoWeight: Number(cargoWeight),
                    distance: Number(distance),
                    status: status || 'Draft',
                    revenue: Number(revenue || 0),
                    vehicleId: vehicleId || null,
                    driverId: driverId || null,
                    eta: status === 'Dispatched' ? 'Calculating...' : status === 'Draft' ? 'Awaiting vehicle' : '--',
                },
            });

            // Trigger cascade changes
            if (status === 'Dispatched' && vehicleId && driverId) {
                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: { status: 'On Trip' },
                });
                await prisma.driver.update({
                    where: { id: driverId },
                    data: { status: 'On Trip' },
                });

                // Create notification alert
                await prisma.notification.create({
                    data: {
                        type: 'Info',
                        message: `🟢 Trip ${finalId} dispatched successfully with Vehicle ${vehicle?.name}`,
                    },
                });
            }

            return NextResponse.json(newTrip, { status: 201 });
        } catch (error: unknown) {
            console.error('Create Trip Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Dispatcher', 'Fleet Manager'],
);
