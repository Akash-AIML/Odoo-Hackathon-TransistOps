// src/middleware/rbac.middleware.ts - Role-Based Access Control Middleware

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Checks if the authenticated user has one of the allowed roles.
 * Returns 403 Forbidden if the user's role is not included in the allowed list.
 */
export function requireRole(allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `Access Denied. Role '${userRole}' is not permitted to perform this operation. Allowed: [${allowedRoles.join(', ')}]`
            });
        }

        next();
    };
}
