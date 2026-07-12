// src/app/api/search/route.ts - Global Search API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { decrypt } from '@/utils/crypto';

// GET /api/search?q=query&type=vehicles,drivers,trips,maintenance
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const query = searchParams.get('q') || '';
            const types = searchParams.get('type')?.split(',') || ['vehicles', 'drivers', 'trips', 'maintenance'];
            const limit = Number(searchParams.get('limit')) || 5;

            if (!query || query.length < 2) {
                return NextResponse.json({
                    vehicles: [], drivers: [], trips: [], maintenance: [],
                });
            }

            const results: {
                vehicles: unknown[];
                drivers: unknown[];
                trips: unknown[];
                maintenance: unknown[];
            } = { vehicles: [], drivers: [], trips: [], maintenance: [] };

            await Promise.all([
                // Search Vehicles
                types.includes('vehicles') && prisma.vehicle.findMany({
                    where: {
                        OR: [
                            { regNo: { contains: query } },
                            { name: { contains: query } },
                            { type: { contains: query } },
                            { region: { contains: query } },
                        ],
                    },
                    take: limit,
                    select: { id: true, regNo: true, name: true, type: true, status: true, region: true },
                }).then((data) => { results.vehicles = data; }),

                // Search Trips
                types.includes('trips') && prisma.trip.findMany({
                    where: {
                        OR: [
                            { id: { contains: query } },
                            { source: { contains: query } },
                            { destination: { contains: query } },
                            { status: { contains: query } },
                        ],
                    },
                    take: limit,
                    include: { vehicle: { select: { name: true } }, driver: { select: { name: true } } },
                }).then((data) => { results.trips = data; }),

                // Search Maintenance
                types.includes('maintenance') && prisma.maintenanceLog.findMany({
                    where: {
                        OR: [
                            { serviceType: { contains: query } },
                            { mechanic: { contains: query } },
                            { status: { contains: query } },
                        ],
                    },
                    take: limit,
                    include: { vehicle: { select: { name: true, regNo: true } } },
                }).then((data) => { results.maintenance = data; }),
            ]);

            // Search Drivers separately (need decryption)
            if (types.includes('drivers')) {
                const allDrivers = await prisma.driver.findMany({
                    select: { id: true, name: true, licenseNo: true, category: true, status: true, safetyScore: true },
                    take: 100,
                });
                const lower = query.toLowerCase();
                results.drivers = allDrivers
                    .filter((d) => {
                        const decryptedLicense = decrypt(d.licenseNo).toLowerCase();
                        return d.name.toLowerCase().includes(lower) ||
                            decryptedLicense.includes(lower) ||
                            d.category.toLowerCase().includes(lower) ||
                            d.status.toLowerCase().includes(lower);
                    })
                    .slice(0, limit)
                    .map((d) => ({ ...d, licenseNo: decrypt(d.licenseNo) }));
            }

            return NextResponse.json(results);
        } catch (error: unknown) {
            console.error('Global Search Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
);
