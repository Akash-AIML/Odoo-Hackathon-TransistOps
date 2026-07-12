// src/controllers/api.controller.ts - API Route Controllers for Operations Control Center

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateVehicleHealth, checkFuelAnomaly } from '../utils/engine';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

// --- 1. Dashboard Controllers ---
export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
        const vehicles = await prisma.vehicle.findMany({ include: { fuelLogs: true } });
        const drivers = await prisma.driver.findMany();
        const trips = await prisma.trip.findMany();
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Calculations
        const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
        
        let totalHealth = 0;
        activeVehicles.forEach(v => {
            totalHealth += calculateVehicleHealth(v, v.fuelLogs);
        });
        const fleetHealth = activeVehicles.length > 0 ? Math.round(totalHealth / activeVehicles.length) : 100;

        const onTripVehicles = vehicles.filter(v => v.status === 'On Trip');
        const fleetUtilization = activeVehicles.length > 0
            ? Math.round((onTripVehicles.length / activeVehicles.length) * 100)
            : 0;

        const driversAvailable = drivers.filter(d => d.status === 'Available').length;
        
        // Count active maintenance warnings or active shop logs
        const maintenanceAlerts = vehicles.filter(v => {
            const serviceRemaining = v.nextServiceOdo - v.odometer;
            return v.status === 'In Shop' || serviceRemaining <= 300;
        }).length;

        // Today's trips count
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayTrips = trips.filter(t => new Date(t.createdAt) >= startOfToday).length;

        // Vehicle status counts
        const statusCounts = {
            Available: vehicles.filter(v => v.status === 'Available').length,
            OnTrip: vehicles.filter(v => v.status === 'On Trip').length,
            InShop: vehicles.filter(v => v.status === 'In Shop').length,
            Retired: vehicles.filter(v => v.status === 'Retired').length
        };

        // Recent Trips (last 5)
        const recentTrips = await prisma.trip.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { vehicle: true, driver: true }
        });

        // Maintenance Queue (upcoming or active checks)
        const maintenanceQueue = await prisma.maintenanceLog.findMany({
            where: { status: 'In Shop' },
            include: { vehicle: true }
        });

        res.json({
            metrics: {
                fleetHealth,
                fleetUtilization,
                driversAvailable,
                maintenanceAlerts,
                todayTrips
            },
            statusCounts,
            alerts: notifications,
            recentTrips,
            maintenanceQueue
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 2. Vehicles Controllers ---
export async function getVehicles(req: AuthenticatedRequest, res: Response) {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: { fuelLogs: true }
        });
        
        // Dynamic health scores
        const vehiclesWithHealth = vehicles.map(v => ({
            ...v,
            health: calculateVehicleHealth(v, v.fuelLogs)
        }));

        res.json(vehiclesWithHealth);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getVehicleProfile(req: AuthenticatedRequest, res: Response) {
    const { regNo } = req.params;
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { regNo },
            include: {
                trips: { orderBy: { createdAt: 'desc' } },
                maintenanceLogs: { orderBy: { date: 'desc' } },
                fuelLogs: { orderBy: { date: 'desc' } }
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle profile not found.' });
        }

        const health = calculateVehicleHealth(vehicle, vehicle.fuelLogs);

        res.json({
            ...vehicle,
            health
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createVehicle(req: AuthenticatedRequest, res: Response) {
    const { regNo, name, type, capacity, odometer, cost } = req.body;
    try {
        const exists = await prisma.vehicle.findUnique({ where: { regNo } });
        if (exists) {
            return res.status(400).json({ error: `Vehicle registration number ${regNo} is already registered.` });
        }

        const docsDefault = JSON.stringify([
            { name: 'Insurance', status: 'Valid', expiry: getRelativeDateString(365) },
            { name: 'RC', status: 'Valid', expiry: getRelativeDateString(1000) },
            { name: 'Fitness', status: 'Valid', expiry: getRelativeDateString(180) }
        ]);

        const newVehicle = await prisma.vehicle.create({
            data: {
                regNo: regNo.toUpperCase().trim(),
                name: name.trim(),
                type,
                capacity: Number(capacity),
                odometer: Number(odometer),
                cost: Number(cost),
                status: 'Available',
                nextServiceOdo: Number(odometer) + 5000,
                documents: docsDefault
            }
        });

        res.status(201).json(newVehicle);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function generateVehicleQR(req: AuthenticatedRequest, res: Response) {
    const { regNo } = req.params;
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { regNo } });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found.' });
        }

        // Generate data payload URL for scanned profile link
        const profileUrl = `http://transitops.in/fleet/${vehicle.regNo}`;
        const qrDataUrl = await QRCode.toDataURL(profileUrl);

        res.json({ regNo: vehicle.regNo, profileUrl, qrDataUrl });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 3. Drivers Controllers ---
export async function getDrivers(req: AuthenticatedRequest, res: Response) {
    try {
        const drivers = await prisma.driver.findMany();
        const today = new Date();

        // Enforce license compliance flags
        const flaggedDrivers = drivers.map(d => {
            const isExpired = new Date(d.expiryDate) < today;
            return {
                ...d,
                isLicenseExpired: isExpired,
                complianceBadge: isExpired ? 'Expired' : (d.status === 'Suspended' ? 'Suspended' : 'Compliant')
            };
        });

        res.json(flaggedDrivers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createDriver(req: AuthenticatedRequest, res: Response) {
    const { name, licenseNo, category, expiryDate, contact, safetyScore } = req.body;
    try {
        const exists = await prisma.driver.findUnique({ where: { licenseNo } });
        if (exists) {
            return res.status(400).json({ error: `Driver with license number ${licenseNo} already exists.` });
        }

        const newDriver = await prisma.driver.create({
            data: {
                name: name.trim(),
                licenseNo: licenseNo.toUpperCase().trim(),
                category,
                expiryDate: new Date(expiryDate),
                contact,
                safetyScore: Number(safetyScore || 100),
                status: 'Available'
            }
        });

        res.status(201).json(newDriver);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateDriverStatus(req: AuthenticatedRequest, res: Response) {
    const { name } = req.params;
    const { status } = req.body;
    try {
        const driver = await prisma.driver.findUnique({ where: { name } });
        if (!driver) {
            return res.status(404).json({ error: 'Driver profile not found.' });
        }

        const updatedDriver = await prisma.driver.update({
            where: { name },
            data: { status }
        });

        res.json(updatedDriver);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 4. Trips Dispatcher Controllers (Hero Logic) ---
export async function getTrips(req: AuthenticatedRequest, res: Response) {
    try {
        const trips = await prisma.trip.findMany({
            include: { vehicle: true, driver: true },
            orderBy: { id: 'desc' }
        });
        res.json(trips);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createTrip(req: AuthenticatedRequest, res: Response) {
    const { id, source, destination, cargoWeight, distance, vehicleId, driverId, status } = req.body;
    try {
        // Enforce unique id generator if not provided
        const finalId = id || 'TR-' + String(Math.floor(100 + Math.random() * 900));
        
        const vehicle = vehicleId ? await prisma.vehicle.findUnique({ where: { id: vehicleId } }) : null;
        const driver = driverId ? await prisma.driver.findUnique({ where: { id: driverId } }) : null;

        // Perform ERP compliance checks for dispatched dispatches
        if (status === 'Dispatched') {
            if (!vehicle) return res.status(400).json({ error: 'A vehicle assignment is required for dispatched trips.' });
            if (!driver) return res.status(400).json({ error: 'A driver assignment is required for dispatched trips.' });

            // Compliance Checks
            if (vehicle.status !== 'Available') {
                return res.status(400).json({ error: `Vehicle ${vehicle.name} is currently ${vehicle.status} and cannot be dispatched.` });
            }
            if (driver.status !== 'Available') {
                return res.status(400).json({ error: `Driver ${driver.name} is currently ${driver.status} and cannot be assigned.` });
            }
            if (new Date(driver.expiryDate) < new Date()) {
                return res.status(400).json({ error: `Dispatch Blocked: Driver license has expired.` });
            }
            if (Number(cargoWeight) > vehicle.capacity) {
                return res.status(400).json({ 
                    error: `Dispatch Blocked: Cargo weight (${cargoWeight} kg) exceeds vehicle load capacity (${vehicle.capacity} kg).` 
                });
            }
        }

        // Save Trip
        const newTrip = await prisma.trip.create({
            data: {
                id: finalId,
                source,
                destination,
                cargoWeight: Number(cargoWeight),
                distance: Number(distance),
                status: status || 'Draft',
                vehicleId: vehicleId || null,
                driverId: driverId || null,
                eta: status === 'Dispatched' ? 'Calculating...' : (status === 'Draft' ? 'Awaiting vehicle' : '--')
            }
        });

        // Trigger cascade changes
        if (status === 'Dispatched' && vehicleId && driverId) {
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'On Trip' }
            });
            await prisma.driver.update({
                where: { id: driverId },
                data: { status: 'On Trip' }
            });

            // Create notification alert
            await prisma.notification.create({
                data: {
                    type: 'Info',
                    message: `🟢 Trip ${finalId} dispatched successfully with Vehicle ${vehicle!.name}`
                }
            });
        }

        res.status(201).json(newTrip);
    } catch (error: any) {
        console.error("DEBUG createTrip Error:", error);
        res.status(500).json({ error: error.message });
    }
}

export async function completeTrip(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { finalOdometer, fuelLiters, fuelCost } = req.body;
    try {
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true }
        });

        if (!trip) return res.status(404).json({ error: 'Trip not found.' });
        if (trip.status !== 'Dispatched') return res.status(400).json({ error: 'Only dispatched active trips can be marked as completed.' });

        const vehicle = trip.vehicle;
        const driver = trip.driver;

        if (vehicle && Number(finalOdometer) <= vehicle.odometer) {
            return res.status(400).json({ 
                error: `Completion blocked: Final odometer (${finalOdometer} km) must exceed current vehicle odometer (${vehicle.odometer} km).` 
            });
        }

        // 1. Log Fuel purchase & check anomaly
        let fuelAnomalyTriggered = false;
        let dropPercent = 0;
        if (vehicle) {
            const actualEfficiency = trip.distance / Number(fuelLiters);
            dropPercent = ((vehicle.fuelEfficiency - actualEfficiency) / vehicle.fuelEfficiency) * 100;
            
            if (dropPercent >= 18.0) {
                fuelAnomalyTriggered = true;
            }

            await prisma.fuelLog.create({
                data: {
                    vehicleId: vehicle.id,
                    date: new Date(),
                    liters: Number(fuelLiters),
                    cost: Number(fuelCost),
                    odometer: Number(finalOdometer),
                    isAnomaly: fuelAnomalyTriggered
                }
            });
        }

        // 2. Update Trip
        await prisma.trip.update({
            where: { id },
            data: { status: 'Completed', eta: '--' }
        });

        // 3. Update Vehicle state: odometer and status
        if (vehicle) {
            const newOdo = Number(finalOdometer);
            const remainingService = vehicle.nextServiceOdo - newOdo;

            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                    odometer: newOdo,
                    status: 'Available',
                    totalTrips: { increment: 1 }
                }
            });

            // Write alerts if service is due
            if (remainingService <= 0) {
                await prisma.notification.create({
                    data: {
                        type: 'Error',
                        message: `🔴 ${vehicle.name} overdue maintenance by ${Math.abs(remainingService)} km`
                    }
                });
            } else if (remainingService <= 300) {
                await prisma.notification.create({
                    data: {
                        type: 'Warning',
                        message: `🟠 ${vehicle.name} requires service inside ${remainingService} km`
                    }
                });
            }

            // Flag anomaly notification
            if (fuelAnomalyTriggered) {
                await prisma.notification.create({
                    data: {
                        type: 'Error',
                        message: `🔴 ${vehicle.name} fuel anomaly detected! Efficiency dropped by ${Math.round(dropPercent)}%`
                    }
                });
            }
        }

        // 4. Update Driver state
        if (driver) {
            await prisma.driver.update({
                where: { id: driver.id },
                data: {
                    status: 'Available',
                    totalDistance: { increment: trip.distance }
                }
            });
        }

        // 5. Trip Completed log
        await prisma.notification.create({
            data: {
                type: 'Info',
                message: `🟢 Trip ${trip.id} completed. Vehicle & Driver returned to pool.`
            }
        });

        res.json({ message: `Trip ${id} completed successfully.` });
    } catch (error: any) {
        console.error("DEBUG completeTrip Error:", error);
        res.status(500).json({ error: error.message });
    }
}

export async function cancelTrip(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
        const trip = await prisma.trip.findUnique({ where: { id } });
        if (!trip) return res.status(404).json({ error: 'Trip not found.' });

        await prisma.trip.update({
            where: { id },
            data: { status: 'Cancelled', eta: '--' }
        });

        if (trip.vehicleId) {
            await prisma.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: 'Available' }
            });
        }

        if (trip.driverId) {
            await prisma.driver.update({
                where: { id: trip.driverId },
                data: { status: 'Available' }
            });
        }

        await prisma.notification.create({
            data: {
                type: 'Warning',
                message: `🟠 Trip ${trip.id} was cancelled.`
            }
        });

        res.json({ message: `Trip ${id} cancelled successfully.` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 5. Maintenance Controllers ---
export async function getMaintenanceLogs(req: AuthenticatedRequest, res: Response) {
    try {
        const logs = await prisma.maintenanceLog.findMany({
            include: { vehicle: true },
            orderBy: { date: 'desc' }
        });
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createMaintenanceLog(req: AuthenticatedRequest, res: Response) {
    const { vehicleId, serviceType, cost, date, status } = req.body;
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

        const log = await prisma.maintenanceLog.create({
            data: {
                vehicleId,
                serviceType,
                cost: Number(cost),
                date: new Date(date),
                status,
                odometer: vehicle.odometer
            }
        });

        // Status transition
        if (status === 'In Shop') {
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'In Shop' }
            });
        }

        res.status(201).json(log);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function closeMaintenanceLog(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
        const log = await prisma.maintenanceLog.findUnique({ where: { id } });
        if (!log) return res.status(404).json({ error: 'Service log not found.' });

        await prisma.maintenanceLog.update({
            where: { id },
            data: { status: 'Completed' }
        });

        // Set vehicle back to available and update next service mileage targets
        const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });
        if (vehicle) {
            const nextService = vehicle.odometer + 5000;
            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                    status: 'Available',
                    nextServiceOdo: nextService
                }
            });
        }

        res.json({ message: 'Service log completed. Vehicle status restored to Available.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 6. Fuel & Expenses Controllers ---
export async function getFuelLogs(req: AuthenticatedRequest, res: Response) {
    try {
        const logs = await prisma.fuelLog.findMany({
            include: { vehicle: true },
            orderBy: { date: 'desc' }
        });
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createFuelLog(req: AuthenticatedRequest, res: Response) {
    const { vehicleId, date, liters, cost, odometer } = req.body;
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

        const { isAnomaly } = checkFuelAnomaly(vehicle.fuelEfficiency, Number(liters), 100); // 100km default check distance

        const log = await prisma.fuelLog.create({
            data: {
                vehicleId,
                date: new Date(date),
                liters: Number(liters),
                cost: Number(cost),
                odometer: Number(odometer),
                isAnomaly
            }
        });

        res.status(201).json(log);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getExpenses(req: AuthenticatedRequest, res: Response) {
    try {
        const expenses = await prisma.expense.findMany({
            include: { vehicle: true, trip: true },
            orderBy: { date: 'desc' }
        });
        res.json(expenses);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function createExpense(req: AuthenticatedRequest, res: Response) {
    const { tripId, vehicleId, toll, other, date } = req.body;
    try {
        const expense = await prisma.expense.create({
            data: {
                tripId: tripId || null,
                vehicleId,
                toll: Number(toll),
                other: Number(other),
                date: date ? new Date(date) : new Date()
            }
        });
        res.status(201).json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 7. Notifications Controllers ---
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
        const alerts = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ message: 'Notification marked as read.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- 8. Settings Controllers ---
export async function getSettings(req: AuthenticatedRequest, res: Response) {
    try {
        const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
    const { depotName, safeSpeedLimit, distanceUnit, currency } = req.body;
    try {
        const updated = await prisma.settings.update({
            where: { id: 'default' },
            data: {
                depotName,
                safeSpeedLimit: Number(safeSpeedLimit),
                distanceUnit,
                currency
            }
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// --- Utilities ---
function getRelativeDateString(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}
