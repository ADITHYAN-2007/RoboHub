import { Router } from 'express';
import { Equipment } from '../models/Equipment.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=
router.get('/', authenticate, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      res.json({
        success: true,
        data: {
          equipment: [],
          inventory: [],
          projects: [],
          users: [],
        },
      });
      return;
    }

    const regex = { $regex: q, $options: 'i' };

    const [equipment, inventory, projects, users] = await Promise.all([
      Equipment.find({
        $or: [{ name: regex }, { equipmentCode: regex }, { assetTag: regex }, { category: regex }],
      })
        .select('name equipmentCode assetTag category status condition')
        .limit(5)
        .lean(),

      InventoryItem.find({
        $or: [{ name: regex }, { componentCode: regex }, { partNumber: regex }, { category: regex }],
      })
        .select('name componentCode category quantity unit storageLocation')
        .limit(5)
        .lean(),

      Project.find({
        $or: [{ projectName: regex }, { projectCode: regex }, { description: regex }],
      })
        .select('projectName projectCode status progress category')
        .limit(5)
        .lean(),

      User.find({
        $or: [{ fullName: regex }, { email: regex }, { collegeId: regex }, { department: regex }],
      })
        .select('fullName email collegeId role department')
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        equipment,
        inventory,
        projects,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
