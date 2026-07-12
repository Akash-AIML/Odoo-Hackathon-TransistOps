import { redirect } from 'next/navigation';
import { FuelExpensesView } from '@/components/fuel/FuelExpensesView';
import { PageHeader } from '@/components/ui/PageHeader';
import { AlertBox } from '@/components/ui/AlertBox';
import { canAccessFuelExpenses } from '@/lib/auth-helpers';
import { apiFetch, getSessionUser } from '@/lib/api/server';
import { getDefaultRoute } from '@/lib/constants';
import type { Expense, FuelLog, PaginatedResponse, Settings } from '@/lib/api/types';

export default async function FuelExpensesPage() {
    const user = await getSessionUser();
    if (!user || !canAccessFuelExpenses(user.role)) {
        redirect(getDefaultRoute(user?.role ?? ''));
    }

    let fuelLogs: FuelLog[] = [];
    let expenses: Expense[] = [];
    let currency = 'INR';
    let error = '';

    try {
        const [fuelRes, expenseRes, settingsRes] = await Promise.all([
            apiFetch<PaginatedResponse<FuelLog>>('/api/fuel?limit=50'),
            apiFetch<PaginatedResponse<Expense>>('/api/expenses?limit=50'),
            apiFetch<Settings>('/api/settings').catch(() => null),
        ]);
        fuelLogs = fuelRes.data;
        expenses = expenseRes.data;
        if (settingsRes) currency = settingsRes.currency;
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load fuel and expense data.';
    }

    return (
        <div>
            <PageHeader
                title="Fuel & Expenses"
                description="Track fuel consumption, anomalies, tolls, and operational costs"
            />

            {error ? <AlertBox>{error}</AlertBox> : <FuelExpensesView fuelLogs={fuelLogs} expenses={expenses} currency={currency} />}
        </div>
    );
}
