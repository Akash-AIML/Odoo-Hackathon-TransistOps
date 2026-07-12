// src/app/api/drivers/route.ts - Driver Management API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { decrypt, encrypt } from '@/utils/crypto';
import { prisma } from '@/utils/db';

// 1. GET /api/drivers - List drivers with pagination, decryption, and license compliance flags
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const status = searchParams.get('status') || undefined;

            const skip = (page - 1) * limit;
            const where = status ? { status } : {};

            const [drivers, total] = await Promise.all([
                prisma.driver.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { name: 'asc' },
                }),
                prisma.driver.count({ where }),
            ]);

            const today = new Date();

            // Decrypt PII data and assign compliance badges
            const processedDrivers = drivers.map((d) => {
                const isExpired = new Date(d.expiryDate) < today;
                return {
                    ...d,
                    licenseNo: decrypt(d.licenseNo),
                    contact: decrypt(d.contact),
                    isLicenseExpired: isExpired,
                    complianceBadge: isExpired ? 'Expired' : d.status === 'Suspended' ? 'Suspended' : 'Compliant',
                };
            });

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: processedDrivers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Drivers Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Dispatcher', 'Safety Officer'],
);

// 2. POST /api/drivers - Create new driver profile (Safety Officer only)
export const POST = withAuth(
    async (req: NextRequest) => {
        try {
            const { name, licenseNo, category, expiryDate, contact, safetyScore } = await req.json();

            if (!name || !licenseNo || !category || !expiryDate || !contact) {
                return NextResponse.json(
                    { error: 'All fields (name, licenseNo, category, expiryDate, contact) are required.' },
                    { status: 400 },
                );
            }

            const formattedLicenseNo = licenseNo.toUpperCase().trim();

            // Check if driver with same license number already exists (must encrypt query or check all)
            // Since it's GCM, the IV changes every time, meaning the same license number yields a different ciphertext.
            // Therefore, we fetch all drivers and compare decrypted license numbers.
            // For a small fleet this is fine, or we can index a hashed license number (SHA256) for lookups.
            // Since we are checking uniqueness, let's fetch drivers and check.
            const drivers = await prisma.driver.findMany();
            const exists = drivers.some((d) => decrypt(d.licenseNo) === formattedLicenseNo);
            if (exists) {
                return NextResponse.json(
                    { error: `Driver with license number ${formattedLicenseNo} already exists.` },
                    { status: 400 },
                );
            }

            const newDriver = await prisma.driver.create({
                data: {
                    name: name.trim(),
                    licenseNo: encrypt(formattedLicenseNo),
                    category,
                    expiryDate: new Date(expiryDate),
                    contact: encrypt(contact.trim()),
                    safetyScore: Number(safetyScore || 100),
                    status: 'Available',
                },
            });

            return NextResponse.json(
                {
                    ...newDriver,
                    licenseNo: formattedLicenseNo,
                    contact: contact.trim(),
                },
                { status: 201 },
            );
        } catch (error: unknown) {
            console.error('Create Driver Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Safety Officer'],
);
