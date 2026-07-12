import { cn } from '@/lib/utils';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}: PrimaryButtonProps) {
    const variants = {
        primary: 'bg-primary text-black hover:bg-primary-hover',
        secondary: 'bg-blue-600 text-white hover:bg-blue-500',
        danger: 'bg-red-600 text-white hover:bg-red-500',
        ghost: 'bg-transparent border border-card-border text-foreground hover:bg-card',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
