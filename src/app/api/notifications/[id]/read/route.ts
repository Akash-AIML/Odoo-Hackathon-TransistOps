// src/app/api/notifications/[id]/read/route.ts - Mark Alert Notification as Read API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const PATCH = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const alert = await prisma.notification.findUnique({ where: { id } });
            if (!alert) {
                return NextResponse.json({ error: 'Notification alert not found.' }, { status: 404 });
            }

            await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });

            return NextResponse.json({ message: 'Notification marked as read.' });
        } catch (error: unknown) {
            console.error('Mark Notification Read Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver', 'Maintenance Technician'],
);
