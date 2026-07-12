export const APP_NAME = 'TransitOps';

export const ROLES = [
    'Admin',
    'Fleet Manager',
    'Dispatcher',
    'Safety Officer',
    'Financial Analyst',
    'Maintenance Technician',
    'Driver',
] as const;

export type Role = (typeof ROLES)[number];

export const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Admin'] },
    { href: '/fleet', label: 'Fleet', icon: 'Truck', roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst', 'Admin'] },
    { href: '/drivers', label: 'Drivers', icon: 'Users', roles: ['Dispatcher', 'Safety Officer', 'Admin'] },
    { href: '/trips', label: 'Trips', icon: 'Route', roles: ['Dispatcher', 'Driver', 'Fleet Manager', 'Safety Officer', 'Financial Analyst', 'Admin'] },
    { href: '/maintenance', label: 'Maintenance', icon: 'Wrench', roles: ['Fleet Manager', 'Maintenance Technician', 'Admin'] },
    { href: '/fuel-expenses', label: 'Fuel & Expenses', icon: 'Fuel', roles: ['Fleet Manager', 'Financial Analyst', 'Admin'] },
    { href: '/analytics', label: 'Analytics', icon: 'BarChart3', roles: ['Fleet Manager', 'Financial Analyst', 'Admin'] },
    { href: '/settings', label: 'Settings', icon: 'Settings', roles: ROLES as unknown as string[] },
] as const;

export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'] as const;
export const VEHICLE_TYPES = ['Van', 'Truck', 'Mini'] as const;
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'] as const;
export const MAINTENANCE_STATUSES = ['Completed', 'In Shop', 'Scheduled', 'Upcoming'] as const;
export const TRIP_STATUSES = ['Draft', 'Ready', 'Dispatched', 'Completed', 'Cancelled'] as const;

export const DEFAULT_ROUTE_BY_ROLE: Record<string, string> = {
    Admin: '/dashboard',
    'Fleet Manager': '/dashboard',
    Dispatcher: '/dashboard',
    'Safety Officer': '/dashboard',
    'Financial Analyst': '/dashboard',
    'Maintenance Technician': '/maintenance',
    Driver: '/trips',
};

export function getDefaultRoute(role: string): string {
    return DEFAULT_ROUTE_BY_ROLE[role] ?? '/settings';
}

export const STATUS_COLORS: Record<string, string> = {
    Available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'On Trip': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Shop': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Retired: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    'Off Duty': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    Suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
    Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Upcoming: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    Ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Dispatched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    Compliant: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};
