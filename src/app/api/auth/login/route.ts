// src/app/api/auth/login/route.ts - User Login API

import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken } from '@/utils/auth';
import { prisma } from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        // 1. Validation
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        // 2. Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // 4. Generate tokens
        const userPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            driverId: user.driverId,
        };
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: user.id });

        // 5. Build response and set refresh token cookie
        const response = NextResponse.json({
            message: 'Login successful.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                driverId: user.driverId,
            },
            token: accessToken,
        });

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
        console.error('Login Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}
