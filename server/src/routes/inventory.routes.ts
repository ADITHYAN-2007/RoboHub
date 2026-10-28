import { Router } from 'express';
import { InventoryItem, InventoryTransaction, type TransactionType } from '../models/InventoryItem.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/inventory
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, lowStockOnly, page = 1, limit = 20, sort = 'name' } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { componentCode: { $regex: String(search), $options: 'i' } },
        { partNumber: { $regex: String(search), $options: 'i' } },
        { manufacturer: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (lowStockOnly === 'true') {
      query.$expr = { $lte: ['$quantity', '$minimumStock'] };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      InventoryItem.find(query).sort(String(sort)).skip(skip).limit(limitNum).lean(),
      InventoryItem.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
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

// GET /api/inventory/low-stock
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$minimumStock'] },
    }).lean();

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/transactions
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { itemId, type, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (itemId) query.inventoryItem = itemId;
    if (type && type !== 'ALL') query.type = type;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find(query)
        .populate('inventoryItem', 'name componentCode unit category')
        .populate('user', 'fullName email')
        .populate('project', 'projectName projectCode')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InventoryTransaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: transactions,
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

// GET /api/inventory/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Component not found' });
      return;
    }

    const transactions = await InventoryTransaction.find({ inventoryItem: item._id })
      .populate('user', 'fullName')
      .populate('project', 'projectName projectCode')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        item,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory (Add new item)
router.post('/', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = req.body;

    const existing = await InventoryItem.findOne({ componentCode: body.componentCode });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A component with this code already exists.',
      });
      return;
    }

    const initialQuantity = Number(body.quantity) || 0;
    const item = await InventoryItem.create({
      ...body,
      quantity: initialQuantity,
    });

    if (initialQuantity > 0) {
      await InventoryTransaction.create({
        inventoryItem: item._id,
        quantity: initialQuantity,
        type: 'STOCK_IN',
        reason: 'Initial stock intake upon component creation',
        user: req.user!._id,
        previousQuantity: 0,
        newQuantity: initialQuantity,
      });
    }

    await logAudit({
      actor: req.user!._id,
      action: 'INVENTORY_CREATED',
      entity: 'InventoryItem',
      entityId: item._id.toString(),
      details: `Created inventory item: ${item.name} (${item.componentCode})`,
      after: item.toObject(),
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Component registered in inventory.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/inventory/:id (Edit metadata)
router.patch('/:id', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found.' });
      return;
    }

    const before = item.toObject();
    delete req.body.quantity; // Quantity must be changed through adjust endpoint to maintain transaction trail
    Object.assign(item, req.body);
    await item.save();

    await logAudit({
      actor: req.user!._id,
      action: 'INVENTORY_UPDATED',
      entity: 'InventoryItem',
      entityId: item._id.toString(),
      details: `Updated details for ${item.name}`,
      before,
      after: item.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Item details updated.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/:id/adjust (Change quantity with mandatory transaction log)
router.post('/:id/adjust', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { delta, type, reason, projectId } = req.body as {
      delta: number;
      type: TransactionType;
      reason: string;
      projectId?: string;
    };

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found.' });
      return;
    }

    if (!delta || !type || !reason) {
      res.status(400).json({
        success: false,
        message: 'Delta quantity, transaction type, and reason are required.',
      });
      return;
    }

    const previousQuantity = item.quantity;
    const newQuantity = previousQuantity + Number(delta);

    if (newQuantity < 0) {
      res.status(400).json({
        success: false,
        message: `Insufficient inventory: Current stock is ${previousQuantity}, cannot decrease by ${Math.abs(delta)}.`,
      });
      return;
    }

    item.quantity = newQuantity;
    await item.save();

    const transaction = await InventoryTransaction.create({
      inventoryItem: item._id,
      quantity: Number(delta),
      type,
      reason: reason.trim(),
      user: req.user!._id,
      project: projectId || undefined,
      previousQuantity,
      newQuantity,
    });

    // Check for low stock alert
    if (newQuantity <= item.minimumStock) {
      await sendNotification({
        recipientRoles: ['LAB_ADMIN', 'LAB_TECHNICIAN'],
        title: 'Low Stock Alert',
        message: `Inventory alert: ${item.name} (${item.componentCode}) has reached ${newQuantity} ${item.unit} (Minimum threshold: ${item.minimumStock}).`,
        type: 'LOW_INVENTORY',
        link: '/inventory',
      });
    }

    await logAudit({
      actor: req.user!._id,
      action: 'INVENTORY_ADJUSTED',
      entity: 'InventoryItem',
      entityId: item._id.toString(),
      details: `Inventory adjustment (${type}) of ${delta} for ${item.name}: ${previousQuantity} -> ${newQuantity}. Reason: ${reason}`,
      before: { quantity: previousQuantity },
      after: { quantity: newQuantity, transactionId: transaction._id },
      req,
    });

    res.json({
      success: true,
      message: `Stock updated successfully to ${newQuantity} ${item.unit}.`,
      data: {
        item,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
