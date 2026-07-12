// src/tests/erp.test.ts - Integration Test Suite for ERP Rules

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TransitOps ERP Integration Tests', () => {
    let vehicleId: string;
    let driverId: string;
    let expiredDriverId: string;

    beforeAll(async () => {
        // Cleanup test data from previous runs to prevent unique constraint failures
        await prisma.trip.deleteMany({
            where: {
                id: { in: ['TR-TEST-01', 'TR-TEST-02', 'TR-TEST-OK'] }
            }
        });

        await prisma.fuelLog.deleteMany({
            where: {
                odometer: 74200
            }
        });

        await prisma.notification.deleteMany({
            where: {
                message: { contains: 'TR-TEST-OK' }
            }
        });

        // Restore vehicle state
        await prisma.vehicle.update({
            where: { regNo: 'GJ01AW5121' },
            data: { odometer: 74000, status: 'Available' }
        });

        // Restore drivers state
        await prisma.driver.update({
            where: { name: 'Alex' },
            data: { status: 'Available' }
        });
        await prisma.driver.update({
            where: { name: 'Jean' },
            data: { status: 'Suspended' }
        });

        // Fetch seeded items for testing
        const vehicle = await prisma.vehicle.findUnique({ where: { regNo: 'GJ01AW5121' } }); // VAN-05 (500kg cap, 74000 odo)
        const driver = await prisma.driver.findUnique({ where: { name: 'Alex' } }); // Alex (Valid LMV)
        const expiredDriver = await prisma.driver.findUnique({ where: { name: 'Jean' } }); // Jean (Expired)

        if (vehicle) vehicleId = vehicle.id;
        if (driver) driverId = driver.id;
        if (expiredDriver) expiredDriverId = expiredDriver.id;
    });

    // Test 1: Service Health Checks
    it('GET /health - Check if server is running', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
    });

    // Test 2: Role Switcher Bypass Verification
    it('GET /api/dashboard - Access granted via role bypass header', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('X-Demo-Role', 'Dispatcher');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('metrics');
        expect(res.body).toHaveProperty('statusCounts');
        expect(res.body).toHaveProperty('alerts');
    });

    // Test 3: Weight Capacity Constraints Validation
    it('POST /api/trips - Should fail if cargo weight exceeds capacity limits', async () => {
        const res = await request(app)
            .post('/api/trips')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                id: 'TR-TEST-01',
                source: 'Gandhinagar Depot',
                destination: 'Vatva Warehouse',
                cargoWeight: 750, // Capacity limit of VAN-05 is 500
                distance: 25,
                vehicleId: vehicleId,
                driverId: driverId,
                status: 'Dispatched'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('exceeds vehicle load capacity');
    });

    // Test 4: Expired License Warnings
    it('POST /api/trips - Should fail if driver license is expired or suspended', async () => {
        // Set status to Available temporarily so license expiry validation is hit instead of Suspended status block
        await prisma.driver.update({
            where: { id: expiredDriverId },
            data: { status: 'Available' }
        });

        const res = await request(app)
            .post('/api/trips')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                id: 'TR-TEST-02',
                source: 'Sanand Depot',
                destination: 'Baroda Hub',
                cargoWeight: 100,
                distance: 40,
                vehicleId: vehicleId,
                driverId: expiredDriverId, // Expired driver
                status: 'Dispatched'
            });

        // Restore Suspended state
        await prisma.driver.update({
            where: { id: expiredDriverId },
            data: { status: 'Suspended' }
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('license has expired');
    });

    // Test 5: Cascading State Changes (Dispatching)
    it('POST /api/trips - Successful dispatch cascades to Vehicle & Driver status', async () => {
        // Reset vehicle & driver to available
        await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'Available' } });
        await prisma.driver.update({ where: { id: driverId }, data: { status: 'Available' } });

        const res = await request(app)
            .post('/api/trips')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                id: 'TR-TEST-OK',
                source: 'Gandhinagar Depot',
                destination: 'Ahmedabad Hub',
                cargoWeight: 350,
                distance: 35,
                vehicleId: vehicleId,
                driverId: driverId,
                status: 'Dispatched'
            });

        expect(res.status).toBe(201);

        // Verify status cascades
        const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        const updatedDriver = await prisma.driver.findUnique({ where: { id: driverId } });

        expect(updatedVehicle?.status).toBe('On Trip');
        expect(updatedDriver?.status).toBe('On Trip');
    });

    // Test 6: Odometer Constraints on completion
    it('POST /api/trips/:id/complete - Fails if odometer is less than current value', async () => {
        const res = await request(app)
            .post('/api/trips/TR-TEST-OK/complete')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                finalOdometer: 73000, // Vehicle current odometer is 74000
                fuelLiters: 15,
                fuelCost: 1500
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('must exceed current vehicle odometer');
    });

    // Test 7: Completing Trip Cascades & Anomaly checks
    it('POST /api/trips/:id/complete - Completing trip updates status and calculates fuel logs', async () => {
        const res = await request(app)
            .post('/api/trips/TR-TEST-OK/complete')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                finalOdometer: 74200, // Odometer increases by 200 km
                fuelLiters: 40, // 200km/40L = 5 km/L. Baseline is 12 km/L (Significant drop! Efficiency anomaly expected)
                fuelCost: 3800
            });

        expect(res.status).toBe(200);

        // Verify vehicle & driver released back to Available
        const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        const updatedDriver = await prisma.driver.findUnique({ where: { id: driverId } });

        expect(updatedVehicle?.status).toBe('Available');
        expect(updatedVehicle?.odometer).toBe(74200);
        expect(updatedDriver?.status).toBe('Available');

        // Check if fuel anomaly flag was set to true on the fuel log
        const latestFuelLog = await prisma.fuelLog.findFirst({
            where: { vehicleId },
            orderBy: { createdAt: 'desc' }
        });
        expect(latestFuelLog?.isAnomaly).toBe(true);

        // Check if a red alert notification was registered
        const notifications = await prisma.notification.findMany({
            where: { message: { contains: 'fuel anomaly detected' } }
        });
        expect(notifications.length).toBeGreaterThan(0);
    });

    // Test 8: RBAC Permissions matrix checks
    it('POST /api/vehicles - Blocking non-authorized role adjustments (RBAC checks)', async () => {
        // Dispatchers are blocked from creating vehicles
        const res = await request(app)
            .post('/api/vehicles')
            .set('X-Demo-Role', 'Dispatcher')
            .send({
                regNo: 'GJ01TEST12',
                name: 'TEST-VAN',
                type: 'Van',
                capacity: 800,
                odometer: 10,
                cost: 50000
            });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Access Denied');
    });
});
