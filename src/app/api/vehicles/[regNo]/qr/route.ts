// src/app/api/vehicles/[regNo]/qr/route.ts - Vehicle QR Code API

import { type NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const GET = withAuth(
    async (req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { regNo } = params;
            const formattedRegNo = regNo.toUpperCase();

            const vehicle = await prisma.vehicle.findUnique({ where: { regNo: formattedRegNo } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
            }

            // Generate dynamic data payload URL for scanned profile link using request host and protocol
            const urlObj = new URL(req.url);
            const protocol = req.headers.get('x-forwarded-proto') || 'http';
            const host = req.headers.get('x-forwarded-host') || urlObj.host;
            const profileUrl = `${protocol}://${host}/fleet/${vehicle.regNo}`;

            const qrDataUrl = await QRCode.toDataURL(profileUrl);

            return NextResponse.json({ regNo: vehicle.regNo, profileUrl, qrDataUrl });
        } catch (error: unknown) {
            console.error('Generate Vehicle QR Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Dispatcher', 'Financial Analyst'],
);
