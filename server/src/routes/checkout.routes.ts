import { Router } from 'express';
import { Checkout } from '../models/Checkout.js';
import { Equipment } from '../models/Equipment.js';
import { Reservation } from '../models/Reservation.js';
import { Maintenance } from '../models/Maintenance.js';
import { IssueReport } from '../models/Maintenance.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/checkouts
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, equipmentId, userId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (req.user!.role === 'STUDENT') {
      query.user = req.user!._id;
    } else if (userId) {
      query.user = userId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (equipmentId) {
      query.equipment = equipmentId;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [checkouts, total] = await Promise.all([
      Checkout.find(query)
        .populate('equipment', 'name equipmentCode category status condition')
        .populate('user', 'fullName email collegeId department phone')
        .populate('issuedBy', 'fullName')
        .populate('receivedBy', 'fullName')
        .sort({ checkoutTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Checkout.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: checkouts,
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

// POST /api/checkouts (Issue equipment)
router.post('/', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { equipmentId, userId, reservationId, expectedReturnTime, conditionBefore, notes } = req.body;

    if (!equipmentId || !userId || !expectedReturnTime) {
      res.status(400).json({
        success: false,
        message: 'Equipment, borrower, and expected return time are required.',
      });
      return;
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    if (equipment.status === 'IN_USE') {
      res.status(400).json({ success: false, message: 'Equipment is already checked out and in use.' });
      return;
    }

    if (['UNDER_MAINTENANCE', 'DAMAGED', 'RETIRED'].includes(equipment.status)) {
      res.status(400).json({
        success: false,
        message: `Equipment is currently ${equipment.status}. Cannot issue.`,
      });
      return;
    }

    // Update equipment status to IN_USE
    const beforeStatus = equipment.status;
    equipment.status = 'IN_USE';
    if (conditionBefore) {
      equipment.condition = conditionBefore;
    }
    await equipment.save();

    // If tied to reservation, update reservation status to ACTIVE
    if (reservationId) {
      await Reservation.findByIdAndUpdate(reservationId, { status: 'ACTIVE' });
    }

    const checkout = await Checkout.create({
      equipment: equipment._id,
      user: userId,
      reservation: reservationId || undefined,
      issuedBy: req.user!._id,
      checkoutTime: new Date(),
      expectedReturnTime: new Date(expectedReturnTime),
      conditionBefore: conditionBefore || equipment.condition || 'GOOD',
      notes: notes || '',
      status: 'CHECKED_OUT',
    });

    await logAudit({
      actor: req.user!._id,
      action: 'CHECKOUT',
      entity: 'Checkout',
      entityId: checkout._id.toString(),
      details: `Issued equipment: ${equipment.name} to user ${userId}`,
      before: { equipmentStatus: beforeStatus },
      after: { equipmentStatus: 'IN_USE', checkoutId: checkout._id },
      req,
    });

    await sendNotification({
      recipientId: userId,
      title: 'Equipment Borrowed',
      message: `You have checked out ${equipment.name}. Expected return: ${new Date(expectedReturnTime).toLocaleString()}.`,
      type: 'EQUIPMENT_DUE',
      link: '/equipment',
    });

    const populated = await Checkout.findById(checkout._id)
      .populate('equipment', 'name equipmentCode category status condition')
      .populate('user', 'fullName collegeId')
      .populate('issuedBy', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Equipment successfully checked out.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/checkouts/:id/return (Check-in equipment)
router.post('/:id/return', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { conditionAfter, damageReported, damageNotes, notes } = req.body;

    const checkout = await Checkout.findById(req.params.id)
      .populate('equipment')
      .populate('user', 'fullName email');

    if (!checkout) {
      res.status(404).json({ success: false, message: 'Checkout record not found.' });
      return;
    }

    if (checkout.status === 'RETURNED' || checkout.status === 'DAMAGED_RETURN') {
      res.status(400).json({ success: false, message: 'Equipment has already been returned.' });
      return;
    }

    const equipment = await Equipment.findById(checkout.equipment);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Associated equipment not found.' });
      return;
    }

    const isDamaged = damageReported || conditionAfter === 'DAMAGED';

    checkout.actualReturnTime = new Date();
    checkout.receivedBy = req.user!._id;
    checkout.conditionAfter = conditionAfter || 'GOOD';
    checkout.damageReported = isDamaged;
    checkout.damageNotes = damageNotes || '';
    if (notes) checkout.notes = `${checkout.notes}\nReturn note: ${notes}`.trim();
    checkout.status = isDamaged ? 'DAMAGED_RETURN' : 'RETURNED';
    await checkout.save();

    // Update equipment status
    const beforeStatus = equipment.status;
    if (isDamaged) {
      equipment.status = 'DAMAGED';
      equipment.condition = 'DAMAGED';
      await equipment.save();

      // Automatically create an issue report and maintenance ticket
      const issue = await IssueReport.create({
        equipment: equipment._id,
        reporter: req.user!._id,
        category: 'Damage on Return',
        description: damageNotes || `Damage reported during check-in from borrower ${(checkout.user as any).fullName}`,
        severity: 'HIGH',
        status: 'OPEN',
      });

      await Maintenance.create({
        equipment: equipment._id,
        maintenanceType: 'REPAIR',
        description: `Repair required after return damage: ${damageNotes || 'Hardware damage'}`,
        technician: req.user!._id,
        startDate: new Date(),
        status: 'SCHEDULED',
      });

      await sendNotification({
        recipientRoles: ['LAB_ADMIN', 'LAB_TECHNICIAN'],
        title: 'Equipment Damage Alert',
        message: `${equipment.name} returned with damage by ${(checkout.user as any).fullName}. Maintenance scheduled.`,
        type: 'ISSUE_UPDATE',
        link: '/maintenance',
      });
    } else {
      equipment.status = 'AVAILABLE';
      equipment.condition = conditionAfter || 'GOOD';
      await equipment.save();
    }

    // If linked to reservation, mark completed
    if (checkout.reservation) {
      await Reservation.findByIdAndUpdate(checkout.reservation, { status: 'COMPLETED' });
    }

    await logAudit({
      actor: req.user!._id,
      action: 'CHECKIN',
      entity: 'Checkout',
      entityId: checkout._id.toString(),
      details: `Checked in equipment: ${equipment.name}. Result status: ${equipment.status}`,
      before: { equipmentStatus: beforeStatus },
      after: { equipmentStatus: equipment.status, condition: equipment.condition },
      req,
    });

    res.json({
      success: true,
      message: isDamaged
        ? 'Equipment returned with damage. Maintenance and Issue tickets created.'
        : 'Equipment returned successfully and marked Available.',
      data: checkout,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
