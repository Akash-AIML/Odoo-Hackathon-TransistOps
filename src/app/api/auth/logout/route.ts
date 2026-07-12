// src/app/api/auth/logout/route.ts - User Logout API

import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully.' });

    // Clear the refresh token cookie
    response.cookies.set({
        name: 'refreshToken',
        value: '',
        httpOnly: true,
        path: '/api/auth',
        expires: new Date(0), // immediately expire
    });

    return response;
}
