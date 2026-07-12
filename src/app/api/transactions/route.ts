// src/app/api/transactions/route.ts - Financial Ledger API

import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';

export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const type = searchParams.get('type') || undefined; // INFLOW or OUTFLOW

            const skip = (page - 1) * limit;
            const where = type ? { type } : {};

            const [transactions, total] = await Promise.all([
                prisma.transaction.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { date: 'desc' },
                }),
                prisma.transaction.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: transactions,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Transactions Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Financial Analyst'],
);
