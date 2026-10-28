import { Router } from 'express';
import { SafetyDocument, SafetyAcknowledgement } from '../models/SafetyAndAudit.js';
import { User } from '../models/User.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/safety
router.get('/', authenticate, async (req, res, next) => {
  try {
    const docs = await SafetyDocument.find({ isActive: true }).sort({ title: 1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/user-status
router.get('/user-status', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const acknowledgements = await SafetyAcknowledgement.find({ user: req.user!._id })
      .populate('safetyDocument', 'code title version category')
      .lean();

    res.json({ success: true, data: acknowledgements });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety/acknowledge
router.post('/acknowledge', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      res.status(400).json({ success: false, message: 'Safety document ID is required.' });
      return;
    }

    const doc = await SafetyDocument.findById(documentId);
    if (!doc) {
      res.status(404).json({ success: false, message: 'Safety document not found.' });
      return;
    }

    let ack = await SafetyAcknowledgement.findOne({
      user: req.user!._id,
      safetyDocument: doc._id,
    });

    if (ack) {
      ack.version = doc.version;
      ack.acknowledgedAt = new Date();
      await ack.save();
    } else {
      ack = await SafetyAcknowledgement.create({
        user: req.user!._id,
        safetyDocument: doc._id,
        version: doc.version,
        acknowledgedAt: new Date(),
      });

      // Update user array
      await User.findByIdAndUpdate(req.user!._id, {
        $addToSet: { safetyAcknowledgedDocs: doc._id },
      });
    }

    await logAudit({
      actor: req.user!._id,
      action: 'SAFETY_ACKNOWLEDGED',
      entity: 'SafetyDocument',
      entityId: doc._id.toString(),
      details: `User acknowledged safety guidelines for ${doc.title} (v${doc.version})`,
      req,
    });

    res.json({
      success: true,
      message: `Safety protocol "${doc.title}" acknowledged.`,
      data: ack,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const doc = await SafetyDocument.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

export default router;
