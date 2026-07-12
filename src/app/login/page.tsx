import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LoginPage() {
    return (
        <AuthLayout>
            <Suspense
                fallback={
                    <div className="mx-auto w-full max-w-md space-y-4">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                }
            >
                <LoginForm />
            </Suspense>
        </AuthLayout>
    );
}
