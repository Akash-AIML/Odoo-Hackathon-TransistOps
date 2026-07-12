const DASHBOARD_ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as const;

export function canAccessDashboard(role: string): boolean {
    return role === 'Admin' || (DASHBOARD_ROLES as readonly string[]).includes(role);
}

export function canAccessFleet(role: string): boolean {
    return role === 'Admin' || ['Fleet Manager', 'Dispatcher', 'Financial Analyst'].includes(role);
}

export function canAccessDrivers(role: string): boolean {
    return role === 'Admin' || ['Fleet Manager', 'Safety Officer'].includes(role);
}

export function canAccessMaintenance(role: string): boolean {
    return role === 'Admin' || ['Fleet Manager', 'Maintenance Technician'].includes(role);
}

export function canAccessFuelExpenses(role: string): boolean {
    return role === 'Admin' || ['Fleet Manager', 'Financial Analyst'].includes(role);
}

export function canAccessAnalytics(role: string): boolean {
    return role === 'Admin' || ['Fleet Manager', 'Financial Analyst'].includes(role);
}

export function canCreateVehicle(role: string): boolean {
    return role === 'Admin' || role === 'Fleet Manager';
}

export function canDispatchTrips(role: string): boolean {
    return role === 'Admin' || role === 'Dispatcher' || role === 'Fleet Manager';
}
