import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import type { UserRole } from '../models/User.js';

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errors: ['UNAUTHENTICATED'],
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`,
        errors: ['INSUFFICIENT_PERMISSIONS'],
      });
      return;
    }

    next();
  };
}

export const isSuperAdmin = requireRoles('SUPER_ADMIN');
export const isAdmin = requireRoles('SUPER_ADMIN', 'LAB_ADMIN');
export const isStaffOrAdmin = requireRoles('SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY', 'LAB_TECHNICIAN');
export const isTechnicianOrAdmin = requireRoles('SUPER_ADMIN', 'LAB_ADMIN', 'LAB_TECHNICIAN');
export const isFacultyOrAdmin = requireRoles('SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY');
