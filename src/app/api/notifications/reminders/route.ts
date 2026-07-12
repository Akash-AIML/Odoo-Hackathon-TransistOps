// src/app/api/notifications/reminders/route.ts - Driving License Expiration Scanner API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { decrypt } from '@/utils/crypto';
import { prisma } from '@/utils/db';

export const POST = withAuth(
    async (_req: NextRequest) => {
        try {
            const drivers = await prisma.driver.findMany();
            const today = new Date();
            const alertThreshold = new Date();
            alertThreshold.setDate(today.getDate() + 30); // 30 days window

            let createdAlertCount = 0;

            for (const d of drivers) {
                const expiry = new Date(d.expiryDate);

                if (expiry < today) {
                    // Already expired
                    const message = `🔴 Driver ${d.name} license (${decrypt(d.licenseNo)}) has expired!`;
                    // Check if notification already exists
                    const existing = await prisma.notification.findFirst({ where: { message } });
                    if (!existing) {
                        await prisma.notification.create({
                            data: { type: 'Error', message },
                        });
                        createdAlertCount++;
                    }
                } else if (expiry <= alertThreshold) {
                    // Expiring within 30 days
                    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    const message = `🟠 Driver ${d.name} license expires in ${daysLeft} days`;

                    const existing = await prisma.notification.findFirst({ where: { message } });
                    if (!existing) {
                        await prisma.notification.create({
                            data: { type: 'Warning', message },
                        });
                        createdAlertCount++;
                    }
                }
            }

            return NextResponse.json({
                message: 'Scan complete.',
                createdAlertCount,
            });
        } catch (error: unknown) {
            console.error('Scan License Reminders Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Safety Officer'],
);
