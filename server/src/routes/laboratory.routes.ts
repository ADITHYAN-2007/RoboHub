import { Router } from 'express';
import { Laboratory, Room } from '../models/Laboratory.js';
import { Equipment } from '../models/Equipment.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';

const router = Router();

// GET /api/laboratories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const labs = await Laboratory.find().populate('manager', 'fullName email').sort({ name: 1 });
    const rooms = await Room.find().sort({ roomNumber: 1 });

    res.json({
      success: true,
      data: {
        laboratories: labs,
        rooms,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/laboratories (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const lab = await Laboratory.create(req.body);
    res.status(201).json({ success: true, data: lab });
  } catch (error) {
    next(error);
  }
});

// POST /api/laboratories/rooms (Admin only)
router.post('/rooms', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

export default router;
