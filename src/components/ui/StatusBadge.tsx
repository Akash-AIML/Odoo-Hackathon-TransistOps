import { STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const colorClass = STATUS_COLORS[status] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                colorClass,
                className,
            )}
        >
            {status}
        </span>
    );
}
