// src/app/api/notifications/[id]/route.ts - Notification Read/Mark API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

const ALL_ROLES = ['Admin', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver', 'Maintenance Technician'];

// GET /api/notifications/[id] - Get a single notification
export const GET = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;
            const notification = await prisma.notification.findUnique({ where: { id } });
            if (!notification) {
                return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
            }
            return NextResponse.json(notification);
        } catch (error: unknown) {
            console.error('Get Notification Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ALL_ROLES,
);

// PATCH /api/notifications/[id] - Mark notification as read
export const PATCH = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;
            const notification = await prisma.notification.findUnique({ where: { id } });
            if (!notification) {
                return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
            }

            const updated = await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });

            return NextResponse.json(updated);
        } catch (error: unknown) {
            console.error('Mark Notification Read Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ALL_ROLES,
);
