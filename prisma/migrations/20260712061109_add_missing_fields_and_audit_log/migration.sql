-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "contact" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL DEFAULT '',
    "experience" INTEGER NOT NULL DEFAULT 0,
    "safetyScore" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL,
    "totalDistance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Driver" ("category", "contact", "createdAt", "expiryDate", "id", "licenseNo", "name", "safetyScore", "status", "totalDistance", "updatedAt") SELECT "category", "contact", "createdAt", "expiryDate", "id", "licenseNo", "name", "safetyScore", "status", "totalDistance", "updatedAt" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
CREATE UNIQUE INDEX "Driver_name_key" ON "Driver"("name");
CREATE UNIQUE INDEX "Driver_licenseNo_key" ON "Driver"("licenseNo");
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "toll" INTEGER NOT NULL DEFAULT 0,
    "other" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("createdAt", "date", "id", "other", "toll", "tripId", "updatedAt", "vehicleId") SELECT "createdAt", "date", "id", "other", "toll", "tripId", "updatedAt", "vehicleId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE TABLE "new_FuelLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "tripId" TEXT,
    "date" DATETIME NOT NULL,
    "liters" REAL NOT NULL,
    "pricePerLiter" REAL NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL,
    "odometer" INTEGER NOT NULL,
    "fuelStation" TEXT NOT NULL DEFAULT '',
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FuelLog" ("cost", "createdAt", "date", "id", "isAnomaly", "liters", "odometer", "updatedAt", "vehicleId") SELECT "cost", "createdAt", "date", "id", "isAnomaly", "liters", "odometer", "updatedAt", "vehicleId" FROM "FuelLog";
DROP TABLE "FuelLog";
ALTER TABLE "new_FuelLog" RENAME TO "FuelLog";
CREATE TABLE "new_MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "mechanic" TEXT NOT NULL DEFAULT '',
    "cost" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL,
    "odometer" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceLog" ("cost", "createdAt", "date", "id", "odometer", "serviceType", "status", "updatedAt", "vehicleId") SELECT "cost", "createdAt", "date", "id", "odometer", "serviceType", "status", "updatedAt", "vehicleId" FROM "MaintenanceLog";
DROP TABLE "MaintenanceLog";
ALTER TABLE "new_MaintenanceLog" RENAME TO "MaintenanceLog";
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "cargoWeight" INTEGER NOT NULL,
    "distance" REAL NOT NULL,
    "estimatedFuel" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "eta" TEXT NOT NULL DEFAULT '--',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("cargoWeight", "createdAt", "destination", "distance", "driverId", "eta", "id", "revenue", "source", "status", "updatedAt", "vehicleId") SELECT "cargoWeight", "createdAt", "destination", "distance", "driverId", "eta", "id", "revenue", "source", "status", "updatedAt", "vehicleId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "odometer" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "nextServiceOdo" INTEGER NOT NULL DEFAULT 5000,
    "fuelEfficiency" REAL NOT NULL DEFAULT 12.0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT NOT NULL DEFAULT 'Central',
    "insuranceExpiry" DATETIME,
    "pollutionExpiry" DATETIME,
    "documents" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Vehicle" ("capacity", "cost", "createdAt", "documents", "fuelEfficiency", "health", "id", "name", "nextServiceOdo", "odometer", "regNo", "status", "totalTrips", "type", "updatedAt") SELECT "capacity", "cost", "createdAt", "documents", "fuelEfficiency", "health", "id", "name", "nextServiceOdo", "odometer", "regNo", "status", "totalTrips", "type", "updatedAt" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_regNo_key" ON "Vehicle"("regNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
