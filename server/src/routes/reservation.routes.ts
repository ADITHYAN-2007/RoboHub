import { Router } from 'express';
import { Reservation } from '../models/Reservation.js';
import { Equipment } from '../models/Equipment.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/reservations (Students see own; staff/admins can see all or filter)
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, equipmentId, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query: any = {};

    // If student, restrict to own reservations unless querying public calendar
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

    if (startDate && endDate) {
      query.startDateTime = { $gte: new Date(String(startDate)), $lte: new Date(String(endDate)) };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('equipment', 'name equipmentCode category status room laboratory')
        .populate('user', 'fullName email collegeId department')
        .populate('approvedBy', 'fullName')
        .populate('project', 'projectName projectCode')
        .sort({ startDateTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Reservation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: reservations,
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

// GET /api/reservations/calendar (Calendar feed for Month/Week/Day view)
router.get('/calendar', authenticate, async (req, res, next) => {
  try {
    const { start, end, equipmentId } = req.query;

    const query: any = {
      status: { $in: ['APPROVED', 'ACTIVE', 'PENDING'] },
    };

    if (start && end) {
      query.startDateTime = { $gte: new Date(String(start)), $lte: new Date(String(end)) };
    }

    if (equipmentId) {
      query.equipment = equipmentId;
    }

    const items = await Reservation.find(query)
      .populate('equipment', 'name equipmentCode category')
      .populate('user', 'fullName collegeId')
      .sort({ startDateTime: 1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations (Create new reservation)
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { equipmentId, date, startTime, endTime, purpose, projectId } = req.body;

    if (!equipmentId || !date || !startTime || !endTime || !purpose) {
      res.status(400).json({
        success: false,
        message: 'Please provide equipment, date, start time, end time, and purpose.',
      });
      return;
    }

    // Verify equipment exists and is not retired or under maintenance
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    if (['RETIRED', 'DAMAGED', 'LOST'].includes(equipment.status)) {
      res.status(400).json({
        success: false,
        message: `Equipment is currently ${equipment.status.toLowerCase().replace('_', ' ')} and cannot be reserved.`,
      });
      return;
    }

    if (equipment.status === 'UNDER_MAINTENANCE') {
      res.status(400).json({
        success: false,
        message: 'Equipment is currently under scheduled maintenance and cannot be reserved.',
      });
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date or time format.' });
      return;
    }

    if (startDateTime >= endDateTime) {
      res.status(400).json({ success: false, message: 'Reservation start time must be before end time.' });
      return;
    }

    // Double booking prevention: Check for overlapping approved or active reservations
    const overlapping = await Reservation.findOne({
      equipment: equipment._id,
      status: { $in: ['APPROVED', 'ACTIVE'] },
      $or: [
        {
          startDateTime: { $lt: endDateTime },
          endDateTime: { $gt: startDateTime },
        },
      ],
    });

    if (overlapping) {
      res.status(409).json({
        success: false,
        message: 'This equipment is already reserved for the selected time window. Please select another slot.',
        errors: ['DOUBLE_BOOKING_PREVENTED'],
      });
      return;
    }

    // Auto-approve if requested by Lab Admin or Super Admin
    const isAutoApproved = ['SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY'].includes(req.user!.role);

    const reservation = await Reservation.create({
      equipment: equipment._id,
      user: req.user!._id,
      date,
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      purpose: purpose.trim(),
      project: projectId || undefined,
      status: isAutoApproved ? 'APPROVED' : 'PENDING',
      approvedBy: isAutoApproved ? req.user!._id : undefined,
      approvedAt: isAutoApproved ? new Date() : undefined,
    });

    await logAudit({
      actor: req.user!._id,
      action: 'RESERVATION_CREATED',
      entity: 'Reservation',
      entityId: reservation._id.toString(),
      details: `Reservation created for ${equipment.name} on ${date} (${startTime}-${endTime})`,
      after: reservation.toObject(),
      req,
    });

    // Notify technicians / admins of pending reservation
    if (!isAutoApproved) {
      await sendNotification({
        recipientRoles: ['LAB_ADMIN', 'LAB_TECHNICIAN'],
        title: 'New Reservation Pending Review',
        message: `${req.user!.fullName} requested ${equipment.name} for ${date} (${startTime}-${endTime}).`,
        type: 'SYSTEM_ALERT',
        link: '/reservations',
      });
    }

    const populated = await Reservation.findById(reservation._id)
      .populate('equipment', 'name equipmentCode category status')
      .populate('user', 'fullName email collegeId');

    res.status(201).json({
      success: true,
      message: isAutoApproved
        ? 'Reservation approved automatically.'
        : 'Reservation submitted successfully and is pending review.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations/:id/approve (Staff/Admin)
router.post('/:id/approve', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('equipment', 'name')
      .populate('user', 'fullName email');

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    // Rule: Cannot approve your own request if normal staff unless admin
    if (reservation.user._id.equals(req.user!._id) && req.user!.role === 'STUDENT') {
      res.status(403).json({ success: false, message: 'You cannot approve your own reservation.' });
      return;
    }

    // Double check conflict
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      equipment: reservation.equipment,
      status: { $in: ['APPROVED', 'ACTIVE'] },
      startDateTime: { $lt: reservation.endDateTime },
      endDateTime: { $gt: reservation.startDateTime },
    });

    if (conflict) {
      res.status(409).json({
        success: false,
        message: 'Cannot approve: An overlapping reservation is already approved for this time slot.',
      });
      return;
    }

    reservation.status = 'APPROVED';
    reservation.approvedBy = req.user!._id;
    reservation.approvedAt = new Date();
    await reservation.save();

    await logAudit({
      actor: req.user!._id,
      action: 'RESERVATION_APPROVED',
      entity: 'Reservation',
      entityId: reservation._id.toString(),
      details: `Reservation approved for ${(reservation.equipment as any).name}`,
      req,
    });

    await sendNotification({
      recipientId: reservation.user._id,
      title: 'Reservation Approved',
      message: `Your reservation for ${(reservation.equipment as any).name} on ${reservation.date} (${reservation.startTime}-${reservation.endTime}) has been approved.`,
      type: 'RESERVATION_APPROVED',
      link: '/reservations',
    });

    res.json({
      success: true,
      message: 'Reservation approved.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations/:id/reject
router.post('/:id/reject', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('equipment', 'name')
      .populate('user', 'fullName email');

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    reservation.status = 'REJECTED';
    reservation.rejectionReason = reason || 'Reservation declined by laboratory administration.';
    await reservation.save();

    await logAudit({
      actor: req.user!._id,
      action: 'RESERVATION_REJECTED',
      entity: 'Reservation',
      entityId: reservation._id.toString(),
      details: `Reservation rejected: ${reservation.rejectionReason}`,
      req,
    });

    await sendNotification({
      recipientId: reservation.user._id,
      title: 'Reservation Rejected',
      message: `Your reservation for ${(reservation.equipment as any).name} was declined: ${reservation.rejectionReason}`,
      type: 'RESERVATION_REJECTED',
      link: '/reservations',
    });

    res.json({
      success: true,
      message: 'Reservation rejected.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reservations/:id/cancel
router.post('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    // Students can only cancel their own pending/approved reservations
    if (req.user!.role === 'STUDENT' && !reservation.user.equals(req.user!._id)) {
      res.status(403).json({ success: false, message: 'You can only cancel your own reservations.' });
      return;
    }

    if (reservation.status === 'COMPLETED' || reservation.status === 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Cannot cancel an active or completed reservation.' });
      return;
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    await logAudit({
      actor: req.user!._id,
      action: 'RESERVATION_CANCELLED',
      entity: 'Reservation',
      entityId: reservation._id.toString(),
      details: `Reservation cancelled by ${req.user!.fullName}`,
      req,
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
