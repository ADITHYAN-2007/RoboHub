import { Router } from 'express';
import { Equipment } from '../models/Equipment.js';
import { Reservation } from '../models/Reservation.js';
import { Checkout } from '../models/Checkout.js';
import { InventoryItem, InventoryTransaction } from '../models/InventoryItem.js';
import { Maintenance, IssueReport } from '../models/Maintenance.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/dashboard (Aggregated KPI statistics for role dashboards)
router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const role = req.user!.role;

    const [
      totalUsers,
      totalEquipment,
      availableEquipment,
      inUseEquipment,
      maintenanceEquipment,
      damagedEquipment,
      pendingReservations,
      activeProjects,
      lowStockItemsCount,
      openIssuesCount,
      activeCheckoutsCount,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Equipment.countDocuments({ status: { $ne: 'RETIRED' } }),
      Equipment.countDocuments({ status: 'AVAILABLE' }),
      Equipment.countDocuments({ status: 'IN_USE' }),
      Equipment.countDocuments({ status: 'UNDER_MAINTENANCE' }),
      Equipment.countDocuments({ status: 'DAMAGED' }),
      Reservation.countDocuments({ status: 'PENDING' }),
      Project.countDocuments({ status: { $in: ['APPROVED', 'IN_PROGRESS', 'TESTING'] } }),
      InventoryItem.countDocuments({ $expr: { $lte: ['$quantity', '$minimumStock'] } }),
      IssueReport.countDocuments({ status: { $in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'] } }),
      Checkout.countDocuments({ status: 'CHECKED_OUT' }),
    ]);

    // Student specific stats
    let userStats: any = {};
    if (role === 'STUDENT') {
      const [myReservations, myUpcoming, myProjects] = await Promise.all([
        Reservation.countDocuments({ user: req.user!._id }),
        Reservation.countDocuments({
          user: req.user!._id,
          status: { $in: ['APPROVED', 'ACTIVE'] },
          startDateTime: { $gte: new Date() },
        }),
        Project.countDocuments({
          $or: [{ createdBy: req.user!._id }, { 'teamMembers.user': req.user!._id }],
        }),
      ]);
      userStats = { myReservations, myUpcoming, myProjects };
    }

    // Status breakdown using MongoDB Aggregation
    const equipmentStatusBreakdown = await Equipment.aggregate([
      { $match: { status: { $ne: 'RETIRED' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Category distribution using MongoDB Aggregation
    const categoryDistribution = await Equipment.aggregate([
      { $match: { status: { $ne: 'RETIRED' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Reservation 7-day trend using MongoDB Aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reservationTrend = await Reservation.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $in: ['$status', ['APPROVED', 'ACTIVE', 'COMPLETED']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Maintenance cost summary using MongoDB Aggregation
    const maintenanceSummary = await Maintenance.aggregate([
      {
        $group: {
          _id: '$maintenanceType',
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Inventory consumption breakdown
    const inventoryConsumption = await InventoryTransaction.aggregate([
      { $match: { type: 'STOCK_OUT' } },
      {
        $group: {
          _id: '$inventoryItem',
          totalQuantityOut: { $sum: { $abs: '$quantity' } },
        },
      },
      { $sort: { totalQuantityOut: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: '$item' },
      {
        $project: {
          name: '$item.name',
          unit: '$item.unit',
          totalQuantityOut: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        kpi: {
          totalUsers,
          totalEquipment,
          availableEquipment,
          inUseEquipment,
          maintenanceEquipment,
          damagedEquipment,
          pendingReservations,
          activeProjects,
          lowStockItemsCount,
          openIssuesCount,
          activeCheckoutsCount,
          ...userStats,
        },
        equipmentStatusBreakdown,
        categoryDistribution,
        reservationTrend,
        maintenanceSummary,
        inventoryConsumption,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/equipment-utilization (Most & least utilized equipment)
router.get('/equipment-utilization', authenticate, async (req, res, next) => {
  try {
    const mostUsed = await Checkout.aggregate([
      {
        $group: {
          _id: '$equipment',
          checkoutCount: { $sum: 1 },
        },
      },
      { $sort: { checkoutCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'equipment',
          localField: '_id',
          foreignField: '_id',
          as: 'equipment',
        },
      },
      { $unwind: '$equipment' },
      {
        $project: {
          name: '$equipment.name',
          code: '$equipment.equipmentCode',
          category: '$equipment.category',
          checkoutCount: 1,
        },
      },
    ]);

    res.json({ success: true, data: { mostUsed } });
  } catch (error) {
    next(error);
  }
});

export default router;
