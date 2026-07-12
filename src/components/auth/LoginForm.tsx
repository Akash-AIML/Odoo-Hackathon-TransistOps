'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDefaultRoute } from '@/lib/constants';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AlertBox } from '@/components/ui/AlertBox';

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = (await res.json()) as {
                error?: string;
                token?: string;
                user?: { id: string; email: string; name: string; role: string; driverId?: string | null };
            };

            if (!res.ok) {
                setError(data.error ?? 'Login failed.');
                return;
            }

            if (data.token && data.user) {
                const maxAge = remember ? 7 * 24 * 60 * 60 : 15 * 60;
                document.cookie = `accessToken=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                document.cookie = `transitops_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${maxAge}; SameSite=Lax`;
            }

            const redirectTo = searchParams.get('from') ?? getDefaultRoute(data.user?.role ?? '');
            router.push(redirectTo);
            router.refresh();
        } catch {
            setError('Unable to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-bold">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted">Enter your credentials to access the control center.</p>

            <form onSubmit={handleSubmit} className="relative mt-8 space-y-5">
                {error && <AlertBox>{error}</AlertBox>}

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                        Email or Username
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="manager@transitops.in"
                        className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="rounded border-card-border"
                        />
                        Remember me
                    </label>
                    <span className="text-muted">Forgot password?</span>
                </div>

                <PrimaryButton type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
                Demo: manager@transitops.in / Password123
            </p>
        </div>
    );
}
