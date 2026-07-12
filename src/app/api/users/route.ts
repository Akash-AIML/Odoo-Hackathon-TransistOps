// src/app/api/users/route.ts - User Administration API

import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

// 1. GET /api/users - List users with pagination and filtering (Admin only)
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const role = searchParams.get('role') || undefined;

            const skip = (page - 1) * limit;
            const where = role ? { role } : {};

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        driverId: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Users Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin'],
);

// 2. POST /api/users - Create User manually (Admin only)
export const POST = withAuth(
    async (req: NextRequest) => {
        try {
            const { email, password, name, role, driverId } = await req.json();

            if (!email || !password || !name || !role) {
                return NextResponse.json({ error: 'Email, password, name, and role are required.' }, { status: 400 });
            }

            const validRoles = [
                'Admin',
                'Fleet Manager',
                'Dispatcher',
                'Safety Officer',
                'Financial Analyst',
                'Maintenance Technician',
                'Driver',
            ];
            if (!validRoles.includes(role)) {
                return NextResponse.json(
                    { error: `Invalid role. Allowed: [${validRoles.join(', ')}]` },
                    { status: 400 },
                );
            }

            const exists = await prisma.user.findUnique({ where: { email } });
            if (exists) {
                return NextResponse.json({ error: `User with email ${email} already exists.` }, { status: 400 });
            }

            // Link to driver validation
            if (driverId) {
                const driver = await prisma.driver.findUnique({ where: { id: driverId } });
                if (!driver) {
                    return NextResponse.json({ error: 'Driver profile linked does not exist.' }, { status: 400 });
                }

                const linked = await prisma.user.findUnique({ where: { driverId } });
                if (linked) {
                    return NextResponse.json(
                        { error: 'This driver profile is already linked to another user.' },
                        { status: 400 },
                    );
                }
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    role,
                    passwordHash,
                    driverId: driverId || null,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    driverId: true,
                    createdAt: true,
                },
            });

            return NextResponse.json(newUser, { status: 201 });
        } catch (error: unknown) {
            console.error('Create User Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin'],
);
