// src/utils/audit.ts - Audit Trail Utility for TransitOps

import { prisma } from './db';

interface AuditOptions {
    userId: string;
    action: string; // CREATE, UPDATE, DELETE, DISPATCH, COMPLETE, CANCEL, CLOSE
    entity: string; // Vehicle, Driver, Trip, MaintenanceLog, etc.
    entityId: string;
    oldValue?: object | null;
    newValue?: object | null;
}

/**
 * Records an audit log entry for a write operation.
 * Fails silently to avoid disrupting the main operation.
 */
export async function auditLog(opts: AuditOptions): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: opts.userId,
                action: opts.action,
                entity: opts.entity,
                entityId: opts.entityId,
                oldValue: opts.oldValue ? JSON.stringify(opts.oldValue) : null,
                newValue: opts.newValue ? JSON.stringify(opts.newValue) : null,
            },
        });
    } catch (err) {
        // Audit logging must never break the primary operation
        console.error('AuditLog write failed (non-fatal):', err);
    }
}
