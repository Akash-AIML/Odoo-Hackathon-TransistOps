// src/app/health/route.ts - Health Check API

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'TransitOps Backend',
    });
}
