// prisma/seed.ts - Database Seeder matching Control Center Mockups

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get date relative to today
const getRelativeDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d;
};

async function main() {
    console.log('Starting seed operations...');

    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.fuelLog.deleteMany();
    await prisma.maintenanceLog.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();

    // 1. Seed Users (Roles Matrix mapping)
    const users = [
        { clerkId: 'user_clerk_fm_01', email: 'manager@transitops.in', name: 'John Doe', role: 'Fleet Manager' },
        { clerkId: 'user_clerk_dp_01', email: 'dispatcher@transitops.in', name: 'Raven K.', role: 'Dispatcher' },
        { clerkId: 'user_clerk_so_01', email: 'safety@transitops.in', name: 'Sarah Smith', role: 'Safety Officer' },
        { clerkId: 'user_clerk_fa_01', email: 'finance@transitops.in', name: 'Alex Patel', role: 'Financial Analyst' }
    ];

    for (const u of users) {
        await prisma.user.create({ data: u });
    }
    console.log('Seeded users.');

    // 2. Seed Settings
    await prisma.settings.create({
        data: {
            id: 'default',
            depotName: 'Gandhinagar Depot G74',
            safeSpeedLimit: 60,
            distanceUnit: 'Kilometers',
            currency: 'INR'
        }
    });

    // 3. Seed Vehicles
    const docStatus = JSON.stringify([
        { name: 'Insurance', status: 'Valid', expiry: '2027-06-30' },
        { name: 'RC', status: 'Valid', expiry: '2030-10-15' },
        { name: 'Fitness', status: 'Valid', expiry: '2026-12-01' }
    ]);

    const vehicles = [
        {
            regNo: 'GJ01AW5121',
            name: 'VAN-05',
            type: 'Van',
            capacity: 500,
            odometer: 74000,
            cost: 620000,
            status: 'Available',
            health: 95,
            nextServiceOdo: 75000, // Service due in 1000 km
            fuelEfficiency: 12.0,
            totalTrips: 45,
            documents: docStatus
        },
        {
            regNo: 'GJ01BA9981',
            name: 'TRUCK-11',
            type: 'Truck',
            capacity: 5000,
            odometer: 192000,
            cost: 2450000,
            status: 'On Trip',
            health: 87,
            nextServiceOdo: 195000,
            fuelEfficiency: 8.0, // Anomaly baseline
            totalTrips: 148,
            documents: docStatus
        },
        {
            regNo: 'GJ01AB1120',
            name: 'MINI-03',
            type: 'Mini',
            capacity: 1000,
            odometer: 66000,
            cost: 410000,
            status: 'In Shop',
            health: 78,
            nextServiceOdo: 68000,
            fuelEfficiency: 14.5,
            totalTrips: 82,
            documents: docStatus
        },
        {
            regNo: 'GJ01AB0089',
            name: 'VAN-09',
            type: 'Van',
            capacity: 750,
            odometer: 241900,
            cost: 590000,
            status: 'Retired',
            health: 0,
            nextServiceOdo: 245000,
            fuelEfficiency: 11.5,
            totalTrips: 201,
            documents: docStatus
        },
        {
            regNo: 'GJ01TRK04',
            name: 'TRK-04',
            type: 'Truck',
            capacity: 5000,
            odometer: 105200,
            cost: 2300000,
            status: 'Available',
            health: 65,
            nextServiceOdo: 105000, // OVERDUE by 200 km
            fuelEfficiency: 9.0,
            totalTrips: 112,
            documents: docStatus
        }
    ];

    const seededVehicles: Record<string, string> = {};
    for (const v of vehicles) {
        const vRec = await prisma.vehicle.create({ data: v });
        seededVehicles[vRec.regNo] = vRec.id;
    }
    console.log('Seeded vehicles.');

    // 4. Seed Drivers
    const drivers = [
        {
            name: 'Alex',
            licenseNo: 'DL-88723',
            category: 'LMV',
            expiryDate: getRelativeDate(1), // Expiress tomorrow! (Creates warning alert)
            contact: '9876599100',
            safetyScore: 96,
            status: 'Available',
            totalDistance: 19800
        },
        {
            name: 'Jean',
            licenseNo: 'DL-99220',
            category: 'LMV',
            expiryDate: getRelativeDate(-100), // Already expired
            contact: '9822088331',
            safetyScore: 89,
            status: 'Suspended',
            totalDistance: 14200
        },
        {
            name: 'Priya',
            licenseNo: 'DL-77031',
            category: 'LMV',
            expiryDate: getRelativeDate(450),
            contact: '9980177221',
            safetyScore: 99,
            status: 'On Trip',
            totalDistance: 25400
        },
        {
            name: 'Suresh',
            licenseNo: 'DL-90045',
            category: 'HGV',
            expiryDate: getRelativeDate(200),
            contact: '9741044220',
            safetyScore: 88,
            status: 'Off Duty',
            totalDistance: 31000
        }
    ];

    const seededDrivers: Record<string, string> = {};
    for (const d of drivers) {
        const dRec = await prisma.driver.create({ data: d });
        seededDrivers[dRec.name] = dRec.id;
    }
    console.log('Seeded drivers.');

    // 5. Seed Trips
    const trips = [
        {
            id: 'TR-001',
            source: 'Gandhinagar Depot',
            destination: 'Ahmedabad Hub',
            cargoWeight: 450,
            distance: 35,
            status: 'Dispatched',
            eta: '45 min',
            vehicleId: seededVehicles['GJ01AW5121'], // VAN-05
            driverId: seededDrivers['Alex']
        },
        {
            id: 'TR-002',
            source: 'Sanand Depot',
            destination: 'Baroda Hub',
            cargoWeight: 4200,
            distance: 110,
            status: 'Completed',
            eta: '--',
            vehicleId: seededVehicles['GJ01BA9981'], // TRUCK-11
            driverId: seededDrivers['Jean']
        },
        {
            id: 'TR-003',
            source: 'Ahmedabad Hub',
            destination: 'Surat Depot',
            cargoWeight: 900,
            distance: 260,
            status: 'Dispatched',
            eta: '3h 10m',
            vehicleId: seededVehicles['GJ01AB1120'], // MINI-03
            driverId: seededDrivers['Priya']
        },
        {
            id: 'TR-004',
            source: 'Vatva Industrial Area',
            destination: 'Sanand Warehouse',
            cargoWeight: 3500,
            distance: 45,
            status: 'Draft',
            eta: 'Awaiting driver',
            vehicleId: seededVehicles['GJ01BA9981'], // TRUCK-11
            driverId: seededDrivers['Suresh']
        },
        {
            id: 'TR-006',
            source: 'Mehsana',
            destination: 'Kalol Depot',
            cargoWeight: 100,
            distance: 15,
            status: 'Cancelled',
            eta: 'Vehicle sent to shop'
        }
    ];

    for (const t of trips) {
        await prisma.trip.create({ data: t });
    }
    console.log('Seeded trips.');

    // 6. Seed Maintenance Logs
    const maintenanceLogs = [
        {
            vehicleId: seededVehicles['GJ01AW5121'],
            serviceType: 'Oil',
            cost: 2500,
            date: getRelativeDate(-11),
            status: 'In Shop',
            odometer: 73900
        },
        {
            vehicleId: seededVehicles['GJ01BA9981'],
            serviceType: 'Engine',
            cost: 18000,
            date: getRelativeDate(-27),
            status: 'Completed',
            odometer: 191800
        },
        {
            vehicleId: seededVehicles['GJ01AB1120'],
            serviceType: 'Tyres',
            cost: 6200,
            date: getRelativeDate(-10),
            status: 'In Shop',
            odometer: 65900
        }
    ];

    for (const m of maintenanceLogs) {
        await prisma.maintenanceLog.create({ data: m });
    }
    console.log('Seeded maintenance.');

    // 7. Seed Fuel Logs
    const fuelLogs = [
        {
            vehicleId: seededVehicles['GJ01AW5121'],
            date: getRelativeDate(-7),
            liters: 42.0,
            cost: 3950,
            odometer: 73800
        },
        {
            // Fuel Anomaly case: 90 Liters for only 540km instead of expected 720km (~8 km/L vs expected 12 km/L)
            vehicleId: seededVehicles['GJ01BA9981'],
            date: getRelativeDate(-6),
            liters: 90.0,
            cost: 8400,
            odometer: 191900,
            isAnomaly: true
        },
        {
            vehicleId: seededVehicles['GJ01AB1120'],
            date: getRelativeDate(-6),
            liters: 28.0,
            cost: 2650,
            odometer: 65850
        }
    ];

    for (const f of fuelLogs) {
        await prisma.fuelLog.create({ data: f });
    }
    console.log('Seeded fuel logs.');

    // 8. Seed Expenses
    const expenses = [
        {
            tripId: 'TR-001',
            vehicleId: seededVehicles['GJ01AW5121'],
            toll: 120,
            other: 0,
            date: getRelativeDate(-7)
        },
        {
            tripId: 'TR-002',
            vehicleId: seededVehicles['GJ01BA9981'],
            toll: 340,
            other: 150,
            date: getRelativeDate(-6)
        }
    ];

    for (const e of expenses) {
        await prisma.expense.create({ data: e });
    }
    console.log('Seeded expenses.');

    // 9. Seed Alerts & Notifications
    const alerts = [
        { type: 'Error', message: '🔴 TRK-04 overdue maintenance' },
        { type: 'Warning', message: '🟠 Alex license expires tomorrow' },
        { type: 'Info', message: '🟢 Fleet utilization increased 9%' },
        { type: 'Error', message: '🔴 TRUCK-11 fuel anomaly detected' }
    ];

    for (const alert of alerts) {
        await prisma.notification.create({ data: alert });
    }
    console.log('Seeded notifications.');

    console.log('Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Seed execution encountered an error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
