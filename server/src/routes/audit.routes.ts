import { Router } from 'express';
import { AuditLog } from '../models/SafetyAndAudit.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';

const router = Router();

// GET /api/audit-logs (Admin only: immutable audit logs)
router.get('/', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { action, entity, actorId, page = 1, limit = 30 } = req.query;

    const query: any = {};
    if (action && action !== 'ALL') query.action = action;
    if (entity && entity !== 'ALL') query.entity = entity;
    if (actorId) query.actor = actorId;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'fullName email role collegeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
