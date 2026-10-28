import { Router } from 'express';
import { ComponentRequest, InventoryItem, InventoryTransaction } from '../models/InventoryItem.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isTechnicianOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/component-requests
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, projectId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (req.user!.role === 'STUDENT') {
      query.requester = req.user!._id;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (projectId) {
      query.project = projectId;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ComponentRequest.find(query)
        .populate('component', 'name componentCode unit quantity minimumStock storageLocation')
        .populate('requester', 'fullName email collegeId department')
        .populate('project', 'projectName projectCode')
        .populate('processedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ComponentRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: requests,
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

// POST /api/component-requests (Student / Faculty request)
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { componentId, requestedQuantity, reason, requiredDate, projectId } = req.body;

    if (!componentId || !requestedQuantity || !reason || !requiredDate) {
      res.status(400).json({
        success: false,
        message: 'Component, quantity, reason, and required date are required.',
      });
      return;
    }

    const component = await InventoryItem.findById(componentId);
    if (!component) {
      res.status(404).json({ success: false, message: 'Requested component not found in inventory.' });
      return;
    }

    const request = await ComponentRequest.create({
      component: component._id,
      requester: req.user!._id,
      requestedQuantity: Number(requestedQuantity),
      reason: reason.trim(),
      requiredDate: new Date(requiredDate),
      project: projectId || undefined,
      status: 'PENDING',
    });

    await logAudit({
      actor: req.user!._id,
      action: 'COMPONENT_REQUEST_CREATED',
      entity: 'ComponentRequest',
      entityId: request._id.toString(),
      details: `Requested ${requestedQuantity}x ${component.name} for: ${reason}`,
      req,
    });

    await sendNotification({
      recipientRoles: ['LAB_ADMIN', 'LAB_TECHNICIAN'],
      title: 'New Component Requisition',
      message: `${req.user!.fullName} requested ${requestedQuantity} ${component.unit} of ${component.name}.`,
      type: 'SYSTEM_ALERT',
      link: '/inventory-requests',
    });

    const populated = await ComponentRequest.findById(request._id)
      .populate('component', 'name componentCode unit quantity')
      .populate('requester', 'fullName collegeId');

    res.status(201).json({
      success: true,
      message: 'Component request submitted for lab technician review.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/component-requests/:id/approve
router.post('/:id/approve', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { approvedQuantity } = req.body;
    const request = await ComponentRequest.findById(req.params.id)
      .populate('component')
      .populate('requester', 'fullName email');

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    const qty = approvedQuantity ? Number(approvedQuantity) : request.requestedQuantity;
    request.approvedQuantity = qty;
    request.status = qty < request.requestedQuantity ? 'PARTIALLY_APPROVED' : 'APPROVED';
    request.processedBy = req.user!._id;
    request.processedAt = new Date();
    await request.save();

    await logAudit({
      actor: req.user!._id,
      action: 'COMPONENT_REQUEST_APPROVED',
      entity: 'ComponentRequest',
      entityId: request._id.toString(),
      details: `Approved ${qty} of ${(request.component as any).name}`,
      req,
    });

    await sendNotification({
      recipientId: request.requester._id,
      title: 'Component Request Approved',
      message: `Your request for ${qty}x ${(request.component as any).name} has been approved. You can collect it from the technician desk.`,
      type: 'PROJECT_APPROVED',
      link: '/inventory-requests',
    });

    res.json({
      success: true,
      message: 'Request approved.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/component-requests/:id/reject
router.post('/:id/reject', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const request = await ComponentRequest.findById(req.params.id)
      .populate('component')
      .populate('requester', 'fullName email');

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    request.status = 'REJECTED';
    request.rejectionReason = rejectionReason || 'Requisition denied by laboratory technician.';
    request.processedBy = req.user!._id;
    request.processedAt = new Date();
    await request.save();

    await sendNotification({
      recipientId: request.requester._id,
      title: 'Component Request Declined',
      message: `Your request for ${(request.component as any).name} was declined: ${request.rejectionReason}`,
      type: 'RESERVATION_REJECTED',
      link: '/inventory-requests',
    });

    res.json({
      success: true,
      message: 'Request rejected.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/component-requests/:id/issue (Deduct inventory stock & mark ISSUED)
router.post('/:id/issue', authenticate, isTechnicianOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const request = await ComponentRequest.findById(req.params.id)
      .populate('component')
      .populate('requester', 'fullName email');

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status === 'ISSUED') {
      res.status(400).json({ success: false, message: 'Components have already been issued.' });
      return;
    }

    const component = await InventoryItem.findById(request.component._id);
    if (!component) {
      res.status(404).json({ success: false, message: 'Component item missing from inventory.' });
      return;
    }

    const issueQty = request.approvedQuantity && request.approvedQuantity > 0 ? request.approvedQuantity : request.requestedQuantity;

    if (component.quantity < issueQty) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock: only ${component.quantity} ${component.unit} available in storage, requested ${issueQty}.`,
      });
      return;
    }

    // Atomic update
    const previousQuantity = component.quantity;
    component.quantity -= issueQty;
    await component.save();

    request.status = 'ISSUED';
    request.processedBy = req.user!._id;
    request.processedAt = new Date();
    await request.save();

    await InventoryTransaction.create({
      inventoryItem: component._id,
      quantity: -issueQty,
      type: 'STOCK_OUT',
      reason: `Issued for Project / Requisition request #${request._id}`,
      user: req.user!._id,
      project: request.project || undefined,
      previousQuantity,
      newQuantity: component.quantity,
    });

    await logAudit({
      actor: req.user!._id,
      action: 'COMPONENT_REQUEST_ISSUED',
      entity: 'ComponentRequest',
      entityId: request._id.toString(),
      details: `Handed over ${issueQty} ${component.unit} of ${component.name} to ${(request.requester as any).fullName}`,
      req,
    });

    await sendNotification({
      recipientId: request.requester._id,
      title: 'Components Issued',
      message: `${issueQty} ${component.unit} of ${component.name} have been handed over. Happy building!`,
      type: 'PROJECT_APPROVED',
      link: '/inventory-requests',
    });

    res.json({
      success: true,
      message: `Issued ${issueQty} ${component.unit}. Inventory stock updated.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
