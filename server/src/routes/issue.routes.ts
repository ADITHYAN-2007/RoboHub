import { Router } from 'express';
import { IssueReport } from '../models/Maintenance.js';
import { Equipment } from '../models/Equipment.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/issues
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, severity, equipmentId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') query.status = status;
    if (severity && severity !== 'ALL') query.severity = severity;
    if (equipmentId) query.equipment = equipmentId;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      IssueReport.find(query)
        .populate('equipment', 'name equipmentCode category status condition')
        .populate('reporter', 'fullName email collegeId department')
        .populate('assignedTechnician', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IssueReport.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: issues,
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

// POST /api/issues (Student / Faculty reports issue)
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { equipmentId, category, description, severity, images } = req.body;

    if (!equipmentId || !description) {
      res.status(400).json({
        success: false,
        message: 'Equipment and issue description are required.',
      });
      return;
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      res.status(404).json({ success: false, message: 'Equipment not found.' });
      return;
    }

    const issue = await IssueReport.create({
      equipment: equipment._id,
      reporter: req.user!._id,
      category: category || 'Hardware Malfunction',
      description: description.trim(),
      severity: severity || 'MEDIUM',
      images: Array.isArray(images) ? images : [],
      status: 'OPEN',
    });

    // If severity is HIGH or CRITICAL, update equipment status to DAMAGED
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      equipment.status = 'DAMAGED';
      equipment.condition = 'DAMAGED';
      await equipment.save();
    }

    await logAudit({
      actor: req.user!._id,
      action: 'ISSUE_CREATED',
      entity: 'IssueReport',
      entityId: issue._id.toString(),
      details: `Reported [${severity || 'MEDIUM'}] issue for ${equipment.name}: ${description}`,
      req,
    });

    // Automated Notification to Technicians & Admins
    await sendNotification({
      recipientRoles: ['LAB_ADMIN', 'LAB_TECHNICIAN'],
      title: `${severity === 'CRITICAL' ? '🚨 CRITICAL: ' : ''}Equipment Issue Reported`,
      message: `${req.user!.fullName} reported an issue on ${equipment.name} (${issue.category} - ${issue.severity}).`,
      type: 'ISSUE_UPDATE',
      link: '/issues',
    });

    const populated = await IssueReport.findById(issue._id)
      .populate('equipment', 'name equipmentCode category status')
      .populate('reporter', 'fullName collegeId');

    res.status(201).json({
      success: true,
      message: 'Issue report submitted. Laboratory technicians have been alerted.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/issues/:id (Update status / resolution - Staff)
router.patch('/:id', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, assignedTechnician, resolutionNotes } = req.body;
    const issue = await IssueReport.findById(req.params.id)
      .populate('equipment', 'name')
      .populate('reporter', 'fullName email');

    if (!issue) {
      res.status(404).json({ success: false, message: 'Issue report not found.' });
      return;
    }

    if (status) issue.status = status;
    if (assignedTechnician) issue.assignedTechnician = assignedTechnician;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    await logAudit({
      actor: req.user!._id,
      action: 'ISSUE_RESOLVED',
      entity: 'IssueReport',
      entityId: issue._id.toString(),
      details: `Issue status changed to ${issue.status}. Resolution: ${resolutionNotes || 'N/A'}`,
      req,
    });

    // Notify reporter
    await sendNotification({
      recipientId: issue.reporter._id,
      title: `Issue ${issue.status}: ${(issue.equipment as any).name}`,
      message: `Your reported issue has been marked as ${issue.status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''}`,
      type: 'ISSUE_UPDATE',
      link: '/issues',
    });

    res.json({
      success: true,
      message: `Issue updated to ${issue.status}.`,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
