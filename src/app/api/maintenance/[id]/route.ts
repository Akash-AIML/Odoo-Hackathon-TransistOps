// src/app/api/maintenance/[id]/route.ts - Maintenance Log Update API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { auditLog } from '@/utils/audit';

// PATCH /api/maintenance/[id] - Update maintenance log details
export const PATCH = withAuth(
    async (req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const log = await prisma.maintenanceLog.findUnique({
                where: { id },
                include: { vehicle: true },
            });
            if (!log) {
                return NextResponse.json({ error: 'Maintenance log not found.' }, { status: 404 });
            }

            const body = await req.json();
            const { serviceType, priority, mechanic, cost, status, endDate, notes } = body;

            const updateData: Record<string, unknown> = {};

            if (serviceType !== undefined) updateData.serviceType = serviceType;
            if (priority !== undefined) {
                const validPriorities = ['Low', 'Normal', 'High', 'Critical'];
                if (!validPriorities.includes(priority)) {
                    return NextResponse.json(
                        { error: `Invalid priority. Allowed: [${validPriorities.join(', ')}]` },
                        { status: 400 },
                    );
                }
                updateData.priority = priority;
            }
            if (mechanic !== undefined) updateData.mechanic = mechanic;
            if (cost !== undefined) updateData.cost = Number(cost);
            if (notes !== undefined) updateData.notes = notes;
            if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

            if (status !== undefined) {
                const validStatuses = ['Open', 'In Progress', 'Completed', 'Closed'];
                if (!validStatuses.includes(status)) {
                    return NextResponse.json(
                        { error: `Invalid status. Allowed: [${validStatuses.join(', ')}]` },
                        { status: 400 },
                    );
                }
                updateData.status = status;

                // Status cascade: closing maintenance returns vehicle to Available
                if ((status === 'Completed' || status === 'Closed') && log.vehicleId) {
                    const vehicle = log.vehicle;
                    if (vehicle && vehicle.status !== 'Retired') {
                        const nextService = vehicle.odometer + 5000;
                        await prisma.vehicle.update({
                            where: { id: log.vehicleId },
                            data: { status: 'Available', nextServiceOdo: nextService },
                        });
                    }
                    if (!updateData.endDate) {
                        updateData.endDate = new Date();
                    }
                }

                // Status cascade: starting work marks vehicle In Progress
                if (status === 'In Progress' && log.vehicleId) {
                    await prisma.vehicle.update({
                        where: { id: log.vehicleId },
                        data: { status: 'In Shop' },
                    });
                }
            }

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
            }

            const updated = await prisma.maintenanceLog.update({ where: { id }, data: updateData });

            await auditLog({
                userId: user.id,
                action: 'UPDATE',
                entity: 'MaintenanceLog',
                entityId: id,
                oldValue: { status: log.status, priority: log.priority },
                newValue: updateData,
            });

            return NextResponse.json(updated);
        } catch (error: unknown) {
            console.error('Update Maintenance Log Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Maintenance Technician'],
);
