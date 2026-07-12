export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    driverId?: string | null;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Vehicle {
    id: string;
    regNo: string;
    name: string;
    type: string;
    capacity: number;
    odometer: number;
    cost: number;
    status: string;
    health: number;
    nextServiceOdo: number;
    fuelEfficiency: number;
    totalTrips: number;
    documents: string;
    createdAt: string;
    updatedAt: string;
}

export interface Driver {
    id: string;
    name: string;
    licenseNo: string;
    category: string;
    expiryDate: string;
    contact: string;
    safetyScore: number;
    status: string;
    totalDistance: number;
    isLicenseExpired?: boolean;
    complianceBadge?: string;
}

export interface Trip {
    id: string;
    source: string;
    destination: string;
    cargoWeight: number;
    distance: number;
    status: string;
    revenue: number;
    eta: string;
    vehicleId?: string | null;
    driverId?: string | null;
    vehicle?: Vehicle | null;
    driver?: Driver | null;
    createdAt: string;
}

export interface MaintenanceLog {
    id: string;
    vehicleId: string;
    serviceType: string;
    cost: number;
    date: string;
    status: string;
    odometer: number;
    vehicle?: Vehicle;
}

export interface FuelLog {
    id: string;
    vehicleId: string;
    date: string;
    liters: number;
    cost: number;
    odometer: number;
    isAnomaly: boolean;
    vehicle?: Vehicle;
}

export interface Expense {
    id: string;
    tripId?: string | null;
    vehicleId: string;
    toll: number;
    other: number;
    date: string;
    vehicle?: Vehicle;
    trip?: Trip | null;
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface Settings {
    id: string;
    depotName: string;
    safeSpeedLimit: number;
    distanceUnit: string;
    currency: string;
}

export interface DashboardData {
    metrics: {
        fleetHealth: number;
        fleetUtilization: number;
        driversAvailable: number;
        maintenanceAlerts: number;
        todayTrips: number;
    };
    statusCounts: {
        Available: number;
        OnTrip: number;
        InShop: number;
        Retired: number;
    };
    alerts: Notification[];
    recentTrips: Trip[];
    maintenanceQueue: MaintenanceLog[];
}

export interface AnalyticsData {
    fleetMetrics: {
        fleetUtilization: number;
        totalOperationalCost: number;
        totalRevenue: number;
        netProfitability: number;
        avgFuelEfficiency: number;
    };
    vehicleReports: Array<{
        id: string;
        regNo: string;
        name: string;
        type: string;
        acquisitionCost: number;
        status: string;
        financials: {
            revenue: number;
            maintenance: number;
            fuel: number;
            tolls: number;
            other: number;
            totalExpenses: number;
            netProfit: number;
            roi: number;
        };
        performance: {
            totalDistance: number;
            totalTrips: number;
            totalFuelLiters: number;
            fuelEfficiency: number;
        };
    }>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}
