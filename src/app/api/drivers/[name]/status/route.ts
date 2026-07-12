// src/app/api/drivers/[name]/status/route.ts - Driver Status Update API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const PATCH = withAuth(
    async (req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { name } = params;
            const { status } = await req.json();

            if (!status) {
                return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
            }

            const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status. Allowed: [${validStatuses.join(', ')}]` },
                    { status: 400 },
                );
            }

            // Find driver by name (ignoring casing or exact name)
            const driver = await prisma.driver.findUnique({ where: { name } });
            if (!driver) {
                return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
            }

            const updatedDriver = await prisma.driver.update({
                where: { name },
                data: { status },
            });

            return NextResponse.json(updatedDriver);
        } catch (error: unknown) {
            console.error('Update Driver Status Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Safety Officer'],
);
