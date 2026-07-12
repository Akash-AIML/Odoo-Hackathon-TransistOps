// src/routes/api.routes.ts - Express Route Configurations with RBAC Enforcements

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
    getDashboardStats,
    getVehicles,
    getVehicleProfile,
    createVehicle,
    generateVehicleQR,
    getDrivers,
    createDriver,
    updateDriverStatus,
    getTrips,
    createTrip,
    completeTrip,
    cancelTrip,
    getMaintenanceLogs,
    createMaintenanceLog,
    closeMaintenanceLog,
    getFuelLogs,
    createFuelLog,
    getExpenses,
    createExpense,
    getNotifications,
    markNotificationRead,
    getSettings,
    updateSettings
} from '../controllers/api.controller';

const router = Router();

// Apply Authentication Globally to all API routes
router.use(authenticateUser);

// --- 1. Dashboard Routes ---
// Permitted: All authenticated roles
router.get('/dashboard', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), getDashboardStats);

// --- 2. Vehicle Registry Routes ---
// Read: Fleet Manager, Dispatcher, Financial Analyst
// Write: Fleet Manager only
router.get('/vehicles', requireRole(['Fleet Manager', 'Dispatcher', 'Financial Analyst']), getVehicles);
router.get('/vehicles/:regNo', requireRole(['Fleet Manager', 'Dispatcher', 'Financial Analyst']), getVehicleProfile);
router.get('/vehicles/:regNo/qr', requireRole(['Fleet Manager', 'Dispatcher', 'Financial Analyst']), generateVehicleQR);
router.post('/vehicles', requireRole(['Fleet Manager']), createVehicle);

// --- 3. Driver Management Routes ---
// Read: Dispatcher, Safety Officer
// Write: Safety Officer only
router.get('/drivers', requireRole(['Dispatcher', 'Safety Officer']), getDrivers);
router.post('/drivers', requireRole(['Safety Officer']), createDriver);
router.patch('/drivers/:name/status', requireRole(['Safety Officer']), updateDriverStatus);

// --- 4. Trip Dispatcher Routes ---
// Read: All roles
// Write: Dispatchers only
router.get('/trips', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), getTrips);
router.post('/trips', requireRole(['Dispatcher']), createTrip);
router.post('/trips/:id/complete', requireRole(['Dispatcher']), completeTrip);
router.post('/trips/:id/cancel', requireRole(['Dispatcher']), cancelTrip);

// --- 5. Maintenance Routes ---
// Read & Write: Fleet Managers only
router.get('/maintenance', requireRole(['Fleet Manager']), getMaintenanceLogs);
router.post('/maintenance', requireRole(['Fleet Manager']), createMaintenanceLog);
router.patch('/maintenance/:id/close', requireRole(['Fleet Manager']), closeMaintenanceLog);

// --- 6. Fuel & Expense Routes ---
// Read: Fleet Manager, Financial Analyst
// Write: Financial Analyst only
router.get('/fuel', requireRole(['Fleet Manager', 'Financial Analyst']), getFuelLogs);
router.post('/fuel', requireRole(['Financial Analyst']), createFuelLog);
router.get('/expenses', requireRole(['Fleet Manager', 'Financial Analyst']), getExpenses);
router.post('/expenses', requireRole(['Financial Analyst']), createExpense);

// --- 7. Notifications Center Routes ---
// Read & Write: All roles
router.get('/notifications', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), getNotifications);
router.patch('/notifications/:id/read', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), markNotificationRead);

// --- 8. Settings Routes ---
// Read: All roles
// Write: Fleet Manager only
router.get('/settings', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), getSettings);
router.put('/settings', requireRole(['Fleet Manager']), updateSettings);

export default router;
