// src/utils/engine.ts - ERP Logic Calculators for Health, Service, and Anomalies

interface DocumentState {
    name: string;
    status: string;
    expiry: string;
}

/**
 * Calculates a vehicle's health score (0-100) dynamically based on operational state.
 */
export function calculateVehicleHealth(vehicle: {
    status: string;
    odometer: number;
    nextServiceOdo: number;
    totalTrips: number;
    fuelEfficiency: number;
    documents: string;
}, fuelLogs: { liters: number; cost: number; odometer: number }[] = []): number {
    if (vehicle.status === 'Retired') {
        return 0;
    }

    let health = 100;

    // Rule 1: Active In Shop Status
    if (vehicle.status === 'In Shop') {
        health -= 10;
    }

    // Rule 2: Overdue Maintenance
    const serviceRemaining = vehicle.nextServiceOdo - vehicle.odometer;
    if (serviceRemaining <= 0) {
        health -= 15; // Maintenance overdue
    } else if (serviceRemaining <= 300) {
        health -= 5; // Impending maintenance alert
    }

    // Rule 3: Usage / Age Depreciation (based on total trips as proxy)
    const tripDepreciation = Math.floor(vehicle.totalTrips / 50) * 2;
    health -= Math.min(tripDepreciation, 20); // Cap depreciation at -20 points

    // Rule 4: Fuel Efficiency Drops
    if (fuelLogs.length > 0) {
        // Calculate average efficiency from recent logs (km per liter)
        // For simplicity, we calculate based on the odometer difference divided by total fuel
        const sortedLogs = [...fuelLogs].sort((a, b) => a.odometer - b.odometer);
        if (sortedLogs.length >= 2) {
            const odoDiff = sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer;
            const totalLiters = sortedLogs.slice(1).reduce((sum, log) => sum + log.liters, 0);
            
            if (odoDiff > 0 && totalLiters > 0) {
                const avgEfficiency = odoDiff / totalLiters;
                const dropPercent = ((vehicle.fuelEfficiency - avgEfficiency) / vehicle.fuelEfficiency) * 100;
                
                if (dropPercent >= 10) {
                    health -= 10; // Efficiency drop penalty
                }
            }
        }
    }

    // Rule 5: Expired documents penalty
    try {
        const docs = JSON.parse(vehicle.documents) as DocumentState[];
        const today = new Date();
        const hasExpiredDoc = docs.some(d => new Date(d.expiry) < today || d.status === 'Expired');
        if (hasExpiredDoc) {
            health -= 10;
        }
    } catch (e) {
        // ignore JSON parsing error
    }

    return Math.max(0, health);
}

/**
 * Checks if a fuel purchase log represents an anomalous consumption drop.
 * Rules: Flags as anomaly if fuel efficiency is 18% or more below baseline efficiency.
 */
export function checkFuelAnomaly(
    baselineEfficiency: number,
    liters: number,
    distance: number
): { isAnomaly: boolean; dropPercent: number; actualEfficiency: number } {
    if (liters <= 0 || distance <= 0) {
        return { isAnomaly: false, dropPercent: 0, actualEfficiency: baselineEfficiency };
    }

    const actualEfficiency = distance / liters;
    const dropPercent = ((baselineEfficiency - actualEfficiency) / baselineEfficiency) * 100;

    return {
        isAnomaly: dropPercent >= 18.0,
        dropPercent: Math.max(0, Number(dropPercent.toFixed(1))),
        actualEfficiency: Number(actualEfficiency.toFixed(2))
    };
}
