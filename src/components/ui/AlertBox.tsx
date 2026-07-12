import { cn } from '@/lib/utils';

interface AlertBoxProps {
    variant?: 'error' | 'warning' | 'info';
    children: React.ReactNode;
    className?: string;
}

export function AlertBox({ variant = 'error', children, className }: AlertBoxProps) {
    const styles = {
        error: 'border-red-500/40 bg-red-500/10 text-red-300',
        warning: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
        info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    };

    return <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[variant], className)}>{children}</div>;
}
