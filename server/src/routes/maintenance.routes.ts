import { Router } from 'express';
import { Maintenance, IssueReport } from '../models/Maintenance.js';
import { Equipment } from '../models/Equipment.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/maintenance
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, equipmentId, type, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.maintenanceType = type;
    if (equipmentId) query.equipment = equipmentId;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate('equipment', 'name equipmentCode category status condition room laboratory')
        .populate('technician', 'fullName email')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Maintenance.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: records,
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

// POST /api/maintenance (Schedule maintenance)
router.post('/', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { equipmentId, maintenanceType, description, technicianId, startDate, cost, partsUsed, notes } =
      req.body;

    if (!equipmentId || !maintenanceType || !description || !startDate) {
      res.status(400).json({
        success: false,
        message: 'Equipment, maintenance type, description, and start date are required.',
      });
      return;
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    // Set equipment status to UNDER_MAINTENANCE
    const beforeStatus = equipment.status;
    equipment.status = 'UNDER_MAINTENANCE';
    await equipment.save();

    const maintenance = await Maintenance.create({
      equipment: equipment._id,
      maintenanceType,
      description: description.trim(),
      technician: technicianId || req.user!._id,
      startDate: new Date(startDate),
      cost: Number(cost) || 0,
      partsUsed: Array.isArray(partsUsed) ? partsUsed : [partsUsed].filter(Boolean),
      notes: notes || '',
      status: 'SCHEDULED',
    });

    await logAudit({
      actor: req.user!._id,
      action: 'MAINTENANCE_CREATED',
      entity: 'Maintenance',
      entityId: maintenance._id.toString(),
      details: `Scheduled ${maintenanceType} maintenance for ${equipment.name}`,
      before: { equipmentStatus: beforeStatus },
      after: { equipmentStatus: 'UNDER_MAINTENANCE', maintenanceId: maintenance._id },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully.',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/maintenance/:id
router.patch('/:id', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Maintenance record not found' });
      return;
    }

    Object.assign(record, req.body);
    await record.save();

    res.json({
      success: true,
      message: 'Maintenance record updated.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/:id/complete (Complete maintenance & restore equipment status)
router.post('/:id/complete', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { finalCost, partsUsed, notes, conditionAfter } = req.body;

    const record = await Maintenance.findById(req.params.id).populate('equipment');
    if (!record) {
      res.status(404).json({ success: false, message: 'Maintenance record not found' });
      return;
    }

    const equipment = await Equipment.findById(record.equipment);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Equipment not found' });
      return;
    }

    record.status = 'COMPLETED';
    record.completionDate = new Date();
    if (finalCost !== undefined) record.cost = Number(finalCost);
    if (partsUsed) record.partsUsed = Array.isArray(partsUsed) ? partsUsed : [partsUsed];
    if (notes) record.notes = `${record.notes || ''}\nCompletion Notes: ${notes}`.trim();
    await record.save();

    // Restore equipment to AVAILABLE
    equipment.status = 'AVAILABLE';
    equipment.condition = conditionAfter || 'EXCELLENT';
    equipment.lastMaintenanceDate = new Date();
    equipment.nextMaintenanceDate = new Date(
      Date.now() + (equipment.maintenanceIntervalDays || 90) * 24 * 60 * 60 * 1000
    );
    await equipment.save();

    await logAudit({
      actor: req.user!._id,
      action: 'MAINTENANCE_COMPLETED',
      entity: 'Maintenance',
      entityId: record._id.toString(),
      details: `Completed maintenance for ${equipment.name}. Total cost: $${record.cost}`,
      after: { equipmentStatus: 'AVAILABLE', condition: equipment.condition },
      req,
    });

    res.json({
      success: true,
      message: 'Maintenance completed. Equipment is now available for reservation.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
