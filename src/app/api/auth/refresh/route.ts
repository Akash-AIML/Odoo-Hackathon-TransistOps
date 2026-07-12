// src/app/api/auth/refresh/route.ts - Token Refresh API

import { type NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/auth';
import { prisma } from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'No refresh token provided.' }, { status: 401 });
        }

        // 1. Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired refresh token.' }, { status: 401 });
        }

        // 2. Lookup user
        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) {
            return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
        }

        // 3. Generate new tokens
        const userPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            driverId: user.driverId,
        };
        const newAccessToken = generateAccessToken(userPayload);
        const newRefreshToken = generateRefreshToken({ id: user.id });

        // 4. Respond with rotated refresh token and new access token
        const response = NextResponse.json({
            token: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                driverId: user.driverId,
            },
        });

        response.cookies.set({
            name: 'refreshToken',
            value: newRefreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error: unknown) {
        console.error('Refresh Token Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
