// src/app/api/reports/drivers/route.ts - Driver Performance Report API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { decrypt } from '@/utils/crypto';

export const GET = withAuth(
    async (_req: NextRequest) => {
        try {
            const drivers = await prisma.driver.findMany({
                include: {
                    trips: {
                        include: {
                            expenses: true,
                            fuelLogs: true,
                        },
                    },
                },
            });

            const today = new Date();
            const thirtyDays = new Date();
            thirtyDays.setDate(today.getDate() + 30);

            const driverReports = drivers.map((d) => {
                const completedTrips = d.trips.filter((t) => t.status === 'Completed');
                const cancelledTrips = d.trips.filter((t) => t.status === 'Cancelled');
                const totalRevenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);
                const avgRevenue = completedTrips.length > 0
                    ? Math.round(totalRevenue / completedTrips.length)
                    : 0;

                const isExpired = new Date(d.expiryDate) < today;
                const isExpiringSoon = !isExpired && new Date(d.expiryDate) <= thirtyDays;

                let complianceBadge = 'Compliant';
                if (isExpired) complianceBadge = 'Expired';
                else if (d.status === 'Suspended') complianceBadge = 'Suspended';
                else if (isExpiringSoon) complianceBadge = 'Expiring Soon';

                return {
                    id: d.id,
                    name: d.name,
                    licenseNo: decrypt(d.licenseNo),
                    category: d.category,
                    status: d.status,
                    safetyScore: d.safetyScore,
                    experience: d.experience,
                    expiryDate: d.expiryDate,
                    isLicenseExpired: isExpired,
                    isExpiringSoon,
                    complianceBadge,
                    performance: {
                        totalTrips: d.trips.length,
                        completedTrips: completedTrips.length,
                        cancelledTrips: cancelledTrips.length,
                        totalDistance: d.totalDistance,
                        totalRevenue,
                        avgRevenue,
                        completionRate: d.trips.length > 0
                            ? Math.round((completedTrips.length / d.trips.length) * 100)
                            : 100,
                    },
                };
            });

            // Sort by safety score descending (top performers first)
            driverReports.sort((a, b) => b.safetyScore - a.safetyScore);

            return NextResponse.json({
                drivers: driverReports,
                summary: {
                    total: drivers.length,
                    available: drivers.filter((d) => d.status === 'Available').length,
                    onTrip: drivers.filter((d) => d.status === 'On Trip').length,
                    suspended: drivers.filter((d) => d.status === 'Suspended').length,
                    expiredLicense: driverReports.filter((d) => d.isLicenseExpired).length,
                    expiringSoon: driverReports.filter((d) => d.isExpiringSoon).length,
                },
            });
        } catch (error: unknown) {
            console.error('Driver Performance Report Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Safety Officer', 'Financial Analyst'],
);
