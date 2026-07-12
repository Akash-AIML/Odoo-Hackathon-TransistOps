export function formatCurrency(amount: number, currency = 'INR'): string {
    const value = amount / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatPercent(value: number): string {
    return `${Math.round(value)}%`;
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
}
