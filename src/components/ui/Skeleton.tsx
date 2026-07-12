import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-lg bg-card-border/60', className)} />;
}

export function PageSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton layout
                    <Skeleton key={i} className="h-28" />
                ))}
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton layout
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}
