import { Router } from 'express';
import { Notification } from '../models/SafetyAndAudit.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user!._id }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ recipient: req.user!._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user!._id, isRead: false }, { isRead: true });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

export default router;
