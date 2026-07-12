// src/app/api/auth/register/route.ts - User Registration API

import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken } from '@/utils/auth';
import { prisma } from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const { email, password, name, role } = await req.json();

        // 1. Validation
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'All fields (email, password, name, role) are required.' },
                { status: 400 },
            );
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
            return NextResponse.json({ error: `Invalid role. Allowed: [${validRoles.join(', ')}]` }, { status: 400 });
        }

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: `User with email ${email} already exists.` }, { status: 400 });
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Save to DB
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                role,
                passwordHash,
            },
        });

        // 5. Generate tokens
        const userPayload = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            driverId: newUser.driverId,
        };
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: newUser.id });

        // 6. Set HTTP Only cookie for Refresh Token
        const response = NextResponse.json(
            {
                message: 'User registered successfully.',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                },
                token: accessToken,
            },
            { status: 201 },
        );

        response.cookies.set({
            name: 'refreshToken',
            value: refreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error: unknown) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}
