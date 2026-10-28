import { Router } from 'express';
import QRCode from 'qrcode';
import { Equipment, type EquipmentStatus } from '../models/Equipment.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin, isAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { Reservation } from '../models/Reservation.js';
import { Maintenance } from '../models/Maintenance.js';
import { Checkout } from '../models/Checkout.js';
import { IssueReport } from '../models/Maintenance.js';

const router = Router();

// GET /api/equipment (Public to all authenticated users)
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      search,
      category,
      status,
      laboratory,
      condition,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { equipmentCode: { $regex: String(search), $options: 'i' } },
        { assetTag: { $regex: String(search), $options: 'i' } },
        { manufacturer: { $regex: String(search), $options: 'i' } },
        { model: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (laboratory && laboratory !== 'ALL') {
      query.laboratory = laboratory;
    }

    if (condition && condition !== 'ALL') {
      query.condition = condition;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [equipment, total] = await Promise.all([
      Equipment.find(query)
        .populate('laboratory', 'name code building')
        .populate('room', 'roomNumber name')
        .sort(String(sort))
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Equipment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: equipment,
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

// GET /api/equipment/code/:code (For QR code scan lookup)
router.get('/code/:code', authenticate, async (req, res, next) => {
  try {
    const code = req.params.code.trim();
    const item = await Equipment.findOne({
      $or: [{ equipmentCode: code }, { assetTag: code }],
    })
      .populate('laboratory', 'name code building')
      .populate('room', 'roomNumber name');

    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment not found for provided code/tag.' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// GET /api/equipment/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id)
      .populate('laboratory', 'name code building manager')
      .populate('room', 'roomNumber name capacity')
      .populate('safetyDocumentRequired');

    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    const [reservations, maintenance, checkouts, openIssues] = await Promise.all([
      Reservation.find({ equipment: item._id }).populate('user', 'fullName email collegeId').sort({ startDateTime: -1 }).limit(10),
      Maintenance.find({ equipment: item._id }).populate('technician', 'fullName email').sort({ startDate: -1 }).limit(10),
      Checkout.find({ equipment: item._id }).populate('user', 'fullName collegeId').populate('issuedBy', 'fullName').sort({ checkoutTime: -1 }).limit(10),
      IssueReport.find({ equipment: item._id, status: { $ne: 'CLOSED' } }).populate('reporter', 'fullName collegeId').sort({ createdAt: -1 }),
    ]);

    // Generate or ensure QR data url
    let qrDataUrl = item.qrCodeData;
    if (!qrDataUrl) {
      const qrPayload = JSON.stringify({
        id: item._id.toString(),
        code: item.equipmentCode,
        tag: item.assetTag,
        name: item.name,
      });
      qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 250, margin: 1 });
      item.qrCodeData = qrDataUrl;
      await item.save();
    }

    res.json({
      success: true,
      data: {
        equipment: item,
        reservations,
        maintenance,
        checkouts,
        openIssues,
        qrCodeUrl: qrDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/equipment (Admin / Technician only)
router.post('/', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = req.body;

    const existing = await Equipment.findOne({
      $or: [{ equipmentCode: body.equipmentCode }, { assetTag: body.assetTag }],
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Equipment code or Asset tag is already registered.',
        errors: ['EQUIPMENT_CODE_EXISTS'],
      });
      return;
    }

    const qrPayload = JSON.stringify({
      code: body.equipmentCode,
      tag: body.assetTag,
      name: body.name,
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 250, margin: 1 });

    const newEquipment = await Equipment.create({
      ...body,
      createdBy: req.user!._id,
      qrCodeData: qrDataUrl,
    });

    await logAudit({
      actor: req.user!._id,
      action: 'EQUIPMENT_CREATED',
      entity: 'Equipment',
      entityId: newEquipment._id.toString(),
      details: `Created equipment: ${newEquipment.name} (${newEquipment.equipmentCode})`,
      after: newEquipment.toObject(),
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Equipment registered successfully.',
      data: newEquipment,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/equipment/:id (Admin / Technician only)
router.patch('/:id', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    const before = item.toObject();
    Object.assign(item, req.body);
    await item.save();

    await logAudit({
      actor: req.user!._id,
      action: 'EQUIPMENT_UPDATED',
      entity: 'Equipment',
      entityId: item._id.toString(),
      details: `Updated equipment details for ${item.name}`,
      before,
      after: item.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Equipment updated successfully.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/equipment/:id/status
router.patch('/:id/status', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, condition } = req.body as { status: EquipmentStatus; condition?: string };
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    const beforeStatus = item.status;
    item.status = status;
    if (condition) {
      item.condition = condition as any;
    }
    await item.save();

    await logAudit({
      actor: req.user!._id,
      action: 'EQUIPMENT_STATUS_CHANGED',
      entity: 'Equipment',
      entityId: item._id.toString(),
      details: `Equipment status changed from ${beforeStatus} to ${status}`,
      before: { status: beforeStatus },
      after: { status: item.status, condition: item.condition },
      req,
    });

    res.json({
      success: true,
      message: `Equipment status updated to ${status}.`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/equipment/:id (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    if (item.status === 'IN_USE') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete equipment currently checked out or in use.',
      });
      return;
    }

    item.status = 'RETIRED';
    await item.save();

    await logAudit({
      actor: req.user!._id,
      action: 'EQUIPMENT_STATUS_CHANGED',
      entity: 'Equipment',
      entityId: item._id.toString(),
      details: `Equipment retired/archived: ${item.name}`,
      req,
    });

    res.json({
      success: true,
      message: 'Equipment retired successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
