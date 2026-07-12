// src/app/api/notifications/unread/route.ts - Unread Notification Count API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

const ALL_ROLES = ['Admin', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver', 'Maintenance Technician'];

// GET /api/notifications/unread - Get count of unread notifications
export const GET = withAuth(
    async (_req: NextRequest) => {
        try {
            const [unreadCount, latestUnread] = await Promise.all([
                prisma.notification.count({ where: { isRead: false } }),
                prisma.notification.findMany({
                    where: { isRead: false },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                }),
            ]);

            return NextResponse.json({ unreadCount, latestUnread });
        } catch (error: unknown) {
            console.error('Get Unread Count Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ALL_ROLES,
);

// POST /api/notifications/unread - Mark all notifications as read
export const POST = withAuth(
    async (_req: NextRequest) => {
        try {
            const { count } = await prisma.notification.updateMany({
                where: { isRead: false },
                data: { isRead: true },
            });

            return NextResponse.json({ message: `Marked ${count} notifications as read.`, count });
        } catch (error: unknown) {
            console.error('Mark All Read Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ALL_ROLES,
);
