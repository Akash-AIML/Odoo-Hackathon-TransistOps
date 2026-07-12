// src/app/api/expenses/route.ts - Expense Tracking API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { prisma } from '@/utils/db';
import { auditLog } from '@/utils/audit';

// 1. GET /api/expenses - List expenses with pagination
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;

            const skip = (page - 1) * limit;

            const [expenses, total] = await Promise.all([
                prisma.expense.findMany({
                    include: { vehicle: true, trip: true },
                    skip,
                    take: limit,
                    orderBy: { date: 'desc' },
                }),
                prisma.expense.count(),
            ]);

            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                data: expenses,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error: unknown) {
            console.error('List Expenses Error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Fleet Manager', 'Financial Analyst'],
);

// 2. POST /api/expenses - Create new expense (Financial Analyst only)
export const POST = withAuth(
    async (req: NextRequest, { user }: AuthenticatedContext) => {
        try {
            const { tripId, vehicleId, category, amount, description, toll, other, date } = await req.json();

            if (!vehicleId) {
                return NextResponse.json(
                    { error: 'Vehicle assignment is required.' },
                    { status: 400 },
                );
            }

            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                return NextResponse.json({ error: 'Vehicle profile not found.' }, { status: 404 });
            }

            if (tripId) {
                const trip = await prisma.trip.findUnique({ where: { id: tripId } });
                if (!trip) {
                    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
                }
            }

            const expenseDate = date ? new Date(date) : new Date();

            const expense = await prisma.expense.create({
                data: {
                    tripId: tripId || null,
                    vehicleId,
                    category: category || 'Other',
                    amount: Number(amount || toll || other || 0),
                    description: description || '',
                    toll: Number(toll || 0),
                    other: Number(other || 0),
                    date: expenseDate,
                },
            });

            await auditLog({
                userId: user.id,
                action: 'CREATE',
                entity: 'Expense',
                entityId: expense.id,
                newValue: expense,
            });

            // 3. Register outflow transactions in financial ledger
            await prisma.transaction.create({
                data: {
                    type: 'OUTFLOW',
                    category: category || 'Other Expense',
                    amount: expense.amount,
                    referenceId: expense.id,
                    date: expenseDate,
                },
            });

            return NextResponse.json(expense, { status: 201 });
        } catch (error: unknown) {
            console.error('Create Expense Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Financial Analyst'],
);
