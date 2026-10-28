import { Router } from 'express';
import { SystemSetting } from '../models/SafetyAndAudit.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/settings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const settings = await SystemSetting.find().sort({ category: 1, key: 1 });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/settings/:key
router.patch('/:key', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { value, description } = req.body;
    const setting = await SystemSetting.findOne({ key: req.params.key });

    if (!setting) {
      res.status(404).json({ success: false, message: 'Setting not found' });
      return;
    }

    const before = setting.value;
    setting.value = value;
    if (description) setting.description = description;
    setting.updatedBy = req.user!._id;
    setting.updatedAt = new Date();
    await setting.save();

    await logAudit({
      actor: req.user!._id,
      action: 'USER_UPDATED',
      entity: 'SystemSetting',
      entityId: setting.key,
      details: `Updated setting ${setting.key} from "${before}" to "${value}"`,
      req,
    });

    res.json({ success: true, message: 'Setting updated successfully.', data: setting });
  } catch (error) {
    next(error);
  }
});

export default router;
