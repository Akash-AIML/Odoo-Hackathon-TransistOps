'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save role in localStorage for basic UI state (real auth is in HttpOnly cookie)
            localStorage.setItem('transitops_role', data.user.role);
            
            router.push('/dashboard');
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = (role: string) => {
        // Set demo bypass header preference for local evaluation
        localStorage.setItem('transitops_demo_role', role);
        localStorage.setItem('transitops_role', role);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">TransitOps</h1>
                    <p className="text-slate-400">Smart Transport Control Center</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="manager@transitops.in"
                        />
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-2 py-2.5"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-4 text-center">Fast-track Demo Evaluation Login</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleDemoLogin('Fleet Manager')} className="btn-secondary text-xs py-2">Fleet Manager</button>
                        <button onClick={() => handleDemoLogin('Dispatcher')} className="btn-secondary text-xs py-2">Dispatcher</button>
                        <button onClick={() => handleDemoLogin('Safety Officer')} className="btn-secondary text-xs py-2">Safety Officer</button>
                        <button onClick={() => handleDemoLogin('Financial Analyst')} className="btn-secondary text-xs py-2">Financial Analyst</button>
                        <button onClick={() => handleDemoLogin('Driver')} className="btn-secondary text-xs py-2 col-span-2">Driver</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
