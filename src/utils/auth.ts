// src/utils/auth.ts - JWT Sign & Verification Utilities

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'transitops-access-secret-key-12345!';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'transitops-refresh-secret-key-12345!';

export interface TokenPayload {
    id: string;
    email: string;
    role: string;
    name: string;
    driverId?: string | null;
}

/**
 * Generate a standard short-lived Access Token (JWT)
 */
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
        {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            name: payload.name,
            driverId: payload.driverId || null,
        },
        ACCESS_SECRET,
        { expiresIn: '15m' },
    );
}

/**
 * Generate a long-lived Refresh Token (JWT)
 */
export function generateRefreshToken(payload: { id: string }): string {
    return jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify Access Token (JWT)
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
        return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name,
            driverId: decoded.driverId || null,
        };
    } catch (_e) {
        return null;
    }
}

/**
 * Verify Refresh Token (JWT)
 */
export function verifyRefreshToken(token: string): { id: string } | null {
    try {
        const decoded = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
        return { id: decoded.id };
    } catch (_e) {
        return null;
    }
}
