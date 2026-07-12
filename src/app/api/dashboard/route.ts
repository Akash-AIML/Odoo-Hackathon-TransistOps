// src/app/api/dashboard/route.ts - Dashboard Analytics API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { calculateVehicleHealth } from '@/utils/engine';

export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const vehicleType = searchParams.get('type') || undefined;
            const status = searchParams.get('status') || undefined;
            // Region filter can be mapped to depot or settings, but since we don't have region on vehicle, we can filter by type or status

            const whereClause: { type?: string; status?: string } = {};
            if (vehicleType) whereClause.type = vehicleType;
            if (status) whereClause.status = status;

            const vehicles = await prisma.vehicle.findMany({
                where: whereClause,
                include: { fuelLogs: true },
            });
            const drivers = await prisma.driver.findMany();
            const trips = await prisma.trip.findMany();
            const notifications = await prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            // 1. Calculations
            const activeVehicles = vehicles.filter((v) => v.status !== 'Retired');

            let totalHealth = 0;
            activeVehicles.forEach((v) => {
                totalHealth += calculateVehicleHealth(v, v.fuelLogs);
            });
            const fleetHealth = activeVehicles.length > 0 ? Math.round(totalHealth / activeVehicles.length) : 100;

            const onTripVehicles = vehicles.filter((v) => v.status === 'On Trip');
            const fleetUtilization =
                activeVehicles.length > 0 ? Math.round((onTripVehicles.length / activeVehicles.length) * 100) : 0;

            const driversAvailable = drivers.filter((d) => d.status === 'Available').length;

            // Count active maintenance warnings
            const maintenanceAlerts = vehicles.filter((v) => {
                const serviceRemaining = v.nextServiceOdo - v.odometer;
                return v.status === 'In Shop' || serviceRemaining <= 300;
            }).length;

            // Today's trips count
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayTrips = trips.filter((t) => new Date(t.createdAt) >= startOfToday).length;

            // Vehicle status counts
            const statusCounts = {
                Available: vehicles.filter((v) => v.status === 'Available').length,
                OnTrip: vehicles.filter((v) => v.status === 'On Trip').length,
                InShop: vehicles.filter((v) => v.status === 'In Shop').length,
                Retired: vehicles.filter((v) => v.status === 'Retired').length,
            };

            // Recent Trips (last 5)
            const recentTrips = await prisma.trip.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { vehicle: true, driver: true },
            });

            // Maintenance Queue (upcoming or active checks)
            const maintenanceQueue = await prisma.maintenanceLog.findMany({
                where: { status: 'In Shop' },
                include: { vehicle: true },
            });

            return NextResponse.json({
                metrics: {
                    fleetHealth,
                    fleetUtilization,
                    driversAvailable,
                    maintenanceAlerts,
                    todayTrips,
                },
                statusCounts,
                alerts: notifications,
                recentTrips,
                maintenanceQueue,
            });
        } catch (error: unknown) {
            console.error('Dashboard Stats Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
);
