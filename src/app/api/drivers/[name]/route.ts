// src/app/api/drivers/[name]/route.ts - Driver Profile Edit API

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedContext, withAuth } from '@/middleware/rbac';
import { decrypt, encrypt } from '@/utils/crypto';
import { prisma } from '@/utils/db';
import { auditLog } from '@/utils/audit';

// PATCH /api/drivers/[name] - Full driver profile update (Safety Officer only)
export const PATCH = withAuth(
    async (req: NextRequest, { params, user }: AuthenticatedContext) => {
        try {
            const { name } = params;

            const driver = await prisma.driver.findUnique({ where: { name } });
            if (!driver) {
                return NextResponse.json({ error: 'Driver profile not found.' }, { status: 404 });
            }

            const body = await req.json();
            const { licenseNo, category, expiryDate, contact, emergencyContact, experience, safetyScore, status } = body;

            const updateData: Record<string, unknown> = {};

            if (category !== undefined) updateData.category = category;
            if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
            if (experience !== undefined) updateData.experience = Number(experience);
            if (safetyScore !== undefined) updateData.safetyScore = Number(safetyScore);
            if (status !== undefined) {
                const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
                if (!validStatuses.includes(status)) {
                    return NextResponse.json(
                        { error: `Invalid status. Allowed: [${validStatuses.join(', ')}]` },
                        { status: 400 },
                    );
                }
                updateData.status = status;
            }

            // Encrypt sensitive PII fields before saving
            if (licenseNo !== undefined) {
                const formatted = licenseNo.toUpperCase().trim();
                // Check uniqueness across all drivers (decrypt-compare)
                const allDrivers = await prisma.driver.findMany({ where: { id: { not: driver.id } } });
                const duplicate = allDrivers.some((d) => decrypt(d.licenseNo) === formatted);
                if (duplicate) {
                    return NextResponse.json(
                        { error: `License number ${formatted} is already assigned to another driver.` },
                        { status: 400 },
                    );
                }
                updateData.licenseNo = encrypt(formatted);
            }

            if (contact !== undefined) {
                updateData.contact = encrypt(contact.trim());
            }

            if (emergencyContact !== undefined) {
                updateData.emergencyContact = emergencyContact ? encrypt(emergencyContact.trim()) : '';
            }

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
            }

            const updated = await prisma.driver.update({ where: { name }, data: updateData });

            await auditLog({
                userId: user.id,
                action: 'UPDATE',
                entity: 'Driver',
                entityId: driver.id,
                oldValue: { status: driver.status, safetyScore: driver.safetyScore },
                newValue: updateData,
            });

            // Return decrypted data
            return NextResponse.json({
                ...updated,
                licenseNo: decrypt(updated.licenseNo),
                contact: decrypt(updated.contact),
                emergencyContact: updated.emergencyContact ? decrypt(updated.emergencyContact) : '',
            });
        } catch (error: unknown) {
            console.error('Update Driver Error:', error);
            return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
        }
    },
    ['Safety Officer'],
);
