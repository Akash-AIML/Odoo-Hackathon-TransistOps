'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const storedRole = localStorage.getItem('transitops_role');
        if (!storedRole) {
            router.push('/login');
        } else {
            setRole(storedRole);
        }
    }, [router]);

    if (!isClient || !role) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;

    // RBAC Navigation Logic
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Admin'] },
        { name: 'Vehicles', path: '/vehicles', roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst', 'Admin'] },
        { name: 'Drivers', path: '/drivers', roles: ['Safety Officer', 'Dispatcher', 'Admin'] },
        { name: 'Trips', path: '/trips', roles: ['Fleet Manager', 'Dispatcher', 'Driver', 'Safety Officer', 'Financial Analyst', 'Admin'] },
        { name: 'Maintenance', path: '/maintenance', roles: ['Fleet Manager', 'Maintenance Technician', 'Admin'] },
        { name: 'Fuel Logs', path: '/fuel', roles: ['Fleet Manager', 'Financial Analyst', 'Admin'] },
        { name: 'Expenses', path: '/expenses', roles: ['Fleet Manager', 'Financial Analyst', 'Admin'] },
        { name: 'Reports & ROI', path: '/reports', roles: ['Fleet Manager', 'Financial Analyst', 'Admin'] },
    ];

    const visibleNav = navItems.filter(item => item.roles.includes(role));

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('transitops_role');
        localStorage.removeItem('transitops_demo_role');
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">TransitOps</h1>
                </div>
                
                <div className="p-4 border-b border-slate-800/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Current Role</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium text-slate-300">{role}</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {visibleNav.map((item) => {
                        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                        return (
                            <Link 
                                key={item.path} 
                                href={item.path}
                                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive 
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                                }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link 
                        href="/notifications"
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors mb-2"
                    >
                        <span>Notifications</span>
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Global Background Accents */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none -z-10"></div>
                
                <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-lg font-medium text-slate-200">
                        {visibleNav.find(n => pathname === n.path || pathname.startsWith(`${n.path}/`))?.name || 'Control Center'}
                    </h2>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-400">
                            Status: <span className="text-emerald-400 font-medium">All Systems Operational</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 z-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
