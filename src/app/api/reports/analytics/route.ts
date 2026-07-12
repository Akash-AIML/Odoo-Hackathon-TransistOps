// src/app/api/reports/analytics/route.ts - Reports & Analytics API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const GET = withAuth(
    async (_req: NextRequest) => {
        try {
            const vehicles = await prisma.vehicle.findMany({
                include: {
                    trips: true,
                    maintenanceLogs: true,
                    fuelLogs: true,
                    expenses: true,
                },
            });

            // 1. Compute per-vehicle performance & ROI metrics
            const vehicleReports = vehicles.map((v) => {
                const tripRevenue = v.trips.reduce((sum, t) => sum + t.revenue, 0);
                const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
                const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
                const tollCost = v.expenses.reduce((sum, e) => sum + e.toll, 0);
                const otherCost = v.expenses.reduce((sum, e) => sum + e.other, 0);
                const totalExpenses = maintenanceCost + fuelCost + tollCost + otherCost;

                // ROI = (Revenue - (Maintenance + Fuel + Expenses)) / AcquisitionCost
                const netProfit = tripRevenue - totalExpenses;
                const roi = v.cost > 0 ? Number((netProfit / v.cost).toFixed(4)) : 0; // ratio format

                // Fuel Efficiency = Total Distance / Total Liters
                const totalDistance = v.trips
                    .filter((t) => t.status === 'Completed')
                    .reduce((sum, t) => sum + t.distance, 0);
                const totalLiters = v.fuelLogs.reduce((sum, f) => sum + f.liters, 0);
                const actualEfficiency =
                    totalLiters > 0 ? Number((totalDistance / totalLiters).toFixed(2)) : v.fuelEfficiency;

                return {
                    id: v.id,
                    regNo: v.regNo,
                    name: v.name,
                    type: v.type,
                    acquisitionCost: v.cost,
                    status: v.status,
                    financials: {
                        revenue: tripRevenue,
                        maintenance: maintenanceCost,
                        fuel: fuelCost,
                        tolls: tollCost,
                        other: otherCost,
                        totalExpenses,
                        netProfit,
                        roi,
                    },
                    performance: {
                        totalDistance,
                        totalTrips: v.trips.length,
                        totalFuelLiters: totalLiters,
                        fuelEfficiency: actualEfficiency,
                    },
                };
            });

            // 2. Global Fleet Metrics
            const activeVehicles = vehicles.filter((v) => v.status !== 'Retired');
            const onTripVehicles = vehicles.filter((v) => v.status === 'On Trip');
            const fleetUtilization =
                activeVehicles.length > 0 ? Math.round((onTripVehicles.length / activeVehicles.length) * 100) : 0;

            const totalOperationalCost = vehicleReports.reduce((sum, r) => sum + r.financials.totalExpenses, 0);
            const totalRevenue = vehicleReports.reduce((sum, r) => sum + r.financials.revenue, 0);

            // Average Fuel Efficiency across all active vehicles
            const activeEffs = vehicleReports
                .filter((r) => r.status !== 'Retired')
                .map((r) => r.performance.fuelEfficiency);
            const avgFuelEfficiency =
                activeEffs.length > 0
                    ? Number((activeEffs.reduce((sum, val) => sum + val, 0) / activeEffs.length).toFixed(2))
                    : 0;

            return NextResponse.json({
                fleetMetrics: {
                    fleetUtilization,
                    totalOperationalCost,
                    totalRevenue,
                    netProfitability: totalRevenue - totalOperationalCost,
                    avgFuelEfficiency,
                },
                vehicleReports,
            });
        } catch (error: unknown) {
            console.error('Get Analytics Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Financial Analyst'],
);
