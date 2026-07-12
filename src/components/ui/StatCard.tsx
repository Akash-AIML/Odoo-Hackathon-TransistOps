import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}

export function StatCard({ label, value, sublabel, className }: StatCardProps) {
    return (
        <div className={cn('rounded-xl border border-card-border bg-card p-5', className)}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
        </div>
    );
}
