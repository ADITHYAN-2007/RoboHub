import { Router } from 'express';
import { User, type UserRole } from '../models/User.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isAdmin, isSuperAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { Reservation } from '../models/Reservation.js';
import { Project } from '../models/Project.js';

const router = Router();

// GET /api/users (Admin/SuperAdmin only)
router.get('/', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { collegeId: { $regex: String(search), $options: 'i' } },
        { department: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (status && status !== 'ALL') {
      query.isActive = status === 'ACTIVE';
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
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

// GET /api/users/technicians (for maintenance / equipment assignment)
router.get('/technicians', authenticate, async (req, res, next) => {
  try {
    const techs = await User.find({
      role: { $in: ['LAB_TECHNICIAN', 'LAB_ADMIN', 'SUPER_ADMIN'] },
      isActive: true,
    }).select('fullName email role department collegeId');

    res.json({ success: true, data: techs });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/faculty (for project mentorship)
router.get('/faculty', authenticate, async (req, res, next) => {
  try {
    const faculty = await User.find({
      role: { $in: ['FACULTY', 'LAB_ADMIN', 'SUPER_ADMIN'] },
      isActive: true,
    }).select('fullName email role department collegeId');

    res.json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/profile (Current user updates self profile)
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fullName, phone, department, year, avatarUrl } = req.body;

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const before = user.toObject();

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department) user.department = department.trim();
    if (year) user.year = year;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    await logAudit({
      actor: user._id,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: 'User updated profile details',
      before,
      after: user.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const targetId = req.params.id;
    // Allow self view or admin view
    if (req.user!.role === 'STUDENT' && req.user!._id.toString() !== targetId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const user = await User.findById(targetId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const [reservations, projects] = await Promise.all([
      Reservation.find({ user: user._id }).populate('equipment', 'name equipmentCode status').sort({ createdAt: -1 }).limit(10),
      Project.find({ 'teamMembers.user': user._id }).select('projectName projectCode status progress category'),
    ]);

    res.json({
      success: true,
      data: {
        user,
        reservations,
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/status (Admin/SuperAdmin activates/deactivates user)
router.patch('/:id/status', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser._id.equals(req.user!._id)) {
      res.status(400).json({ success: false, message: 'You cannot change your own account status.' });
      return;
    }

    const before = { isActive: targetUser.isActive };
    targetUser.isActive = Boolean(isActive);
    await targetUser.save();

    await logAudit({
      actor: req.user!._id,
      action: 'USER_STATUS_CHANGED',
      entity: 'User',
      entityId: targetUser._id.toString(),
      details: `User status changed to ${targetUser.isActive ? 'ACTIVE' : 'DEACTIVATED'} for ${targetUser.email}`,
      before,
      after: { isActive: targetUser.isActive },
      req,
    });

    res.json({
      success: true,
      message: `User status updated to ${targetUser.isActive ? 'Active' : 'Deactivated'}.`,
      data: targetUser,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role (SuperAdmin or LabAdmin updates role)
router.patch('/:id/role', authenticate, isAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { role } = req.body as { role: UserRole };
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY', 'LAB_TECHNICIAN', 'STUDENT'];

    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified.' });
      return;
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser._id.equals(req.user!._id)) {
      res.status(400).json({ success: false, message: 'You cannot change your own role.' });
      return;
    }

    if (role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Only SUPER_ADMIN can assign SUPER_ADMIN role.' });
      return;
    }

    const beforeRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit({
      actor: req.user!._id,
      action: 'ROLE_CHANGED',
      entity: 'User',
      entityId: targetUser._id.toString(),
      details: `Role updated from ${beforeRole} to ${role} for ${targetUser.email}`,
      before: { role: beforeRole },
      after: { role },
      req,
    });

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: targetUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
