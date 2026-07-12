// src/app/api/users/[id]/route.ts - User Details, Update, & Delete APIs

import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

// 1. GET /api/users/[id] - Fetch user details (Admin only)
export const GET = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    driverId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found.' }, { status: 404 });
            }

            return NextResponse.json(user);
        } catch (error: unknown) {
            console.error('Get User Details Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin'],
);

// 2. PUT /api/users/[id] - Update user details (Admin only)
export const PUT = withAuth(
    async (req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;
            const body = await req.json();
            const { email, password, name, role, driverId } = body;

            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
                return NextResponse.json({ error: 'User not found.' }, { status: 404 });
            }

            const updateData: {
                email?: string;
                name?: string;
                role?: string;
                passwordHash?: string;
                driverId?: string | null;
            } = {};

            if (email) {
                // Check email unique
                const exists = await prisma.user.findUnique({ where: { email } });
                if (exists && exists.id !== id) {
                    return NextResponse.json({ error: 'Email already in use by another user.' }, { status: 400 });
                }
                updateData.email = email;
            }

            if (name) updateData.name = name;

            if (role) {
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
                updateData.role = role;
            }

            if (password) {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }

            if (driverId !== undefined) {
                if (driverId) {
                    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
                    if (!driver) {
                        return NextResponse.json({ error: 'Driver profile linked does not exist.' }, { status: 400 });
                    }

                    const linked = await prisma.user.findUnique({ where: { driverId } });
                    if (linked && linked.id !== id) {
                        return NextResponse.json(
                            { error: 'This driver profile is already linked to another user.' },
                            { status: 400 },
                        );
                    }
                    updateData.driverId = driverId;
                } else {
                    updateData.driverId = null;
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    driverId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json(updatedUser);
        } catch (error: unknown) {
            console.error('Update User Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin'],
);

// 3. DELETE /api/users/[id] - Delete user account (Admin only)
export const DELETE = withAuth(
    async (_req: NextRequest, { params }: AuthenticatedContext) => {
        try {
            const { id } = params;

            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
                return NextResponse.json({ error: 'User not found.' }, { status: 404 });
            }

            await prisma.user.delete({ where: { id } });

            return NextResponse.json({ message: 'User account deleted successfully.' });
        } catch (error: unknown) {
            console.error('Delete User Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Admin'],
);
