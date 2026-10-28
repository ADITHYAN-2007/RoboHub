import { Router } from 'express';
import { Equipment } from '../models/Equipment.js';
import { Reservation } from '../models/Reservation.js';
import { Checkout } from '../models/Checkout.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { Maintenance } from '../models/Maintenance.js';
import { IssueReport } from '../models/Maintenance.js';
import { Project } from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin, isTechnicianOrAdmin } from '../middleware/rbac.js';

const router = Router();

// Helper to convert objects to CSV string
function jsonToCSV(items: any[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rows = items.map((item) =>
    headers
      .map((h) => {
        let val = item[h.key];
        if (val === undefined || val === null) val = '';
        if (val instanceof Date) val = val.toISOString().split('T')[0];
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headerRow, ...rows].join('\n');
}

// GET /api/reports/equipment
router.get('/equipment', authenticate, isTechnicianOrAdmin, async (req, res, next) => {
  try {
    const items = await Equipment.find().populate('laboratory', 'name').lean();
    const formatted = items.map((i) => ({
      code: i.equipmentCode,
      tag: i.assetTag,
      name: i.name,
      category: i.category,
      manufacturer: i.manufacturer,
      status: i.status,
      condition: i.condition,
      cost: i.purchaseCost || 0,
      laboratory: (i.laboratory as any)?.name || 'General',
    }));

    if (req.query.format === 'csv') {
      const csv = jsonToCSV(formatted, [
        { key: 'code', label: 'Equipment Code' },
        { key: 'tag', label: 'Asset Tag' },
        { key: 'name', label: 'Equipment Name' },
        { key: 'category', label: 'Category' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'status', label: 'Status' },
        { key: 'condition', label: 'Condition' },
        { key: 'cost', label: 'Cost ($)' },
        { key: 'laboratory', label: 'Laboratory' },
      ]);
      res.header('Content-Type', 'text/csv');
      res.attachment('equipment-inventory-report.csv');
      res.send(csv);
      return;
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/reservations
router.get('/reservations', authenticate, isTechnicianOrAdmin, async (req, res, next) => {
  try {
    const items = await Reservation.find()
      .populate('equipment', 'name equipmentCode')
      .populate('user', 'fullName collegeId email department')
      .lean();

    const formatted = items.map((r) => ({
      equipment: (r.equipment as any)?.name || 'Unknown',
      equipmentCode: (r.equipment as any)?.equipmentCode || '',
      borrower: (r.user as any)?.fullName || 'Unknown',
      collegeId: (r.user as any)?.collegeId || '',
      department: (r.user as any)?.department || '',
      date: r.date,
      time: `${r.startTime} - ${r.endTime}`,
      status: r.status,
      purpose: r.purpose,
    }));

    if (req.query.format === 'csv') {
      const csv = jsonToCSV(formatted, [
        { key: 'equipment', label: 'Equipment' },
        { key: 'equipmentCode', label: 'Code' },
        { key: 'borrower', label: 'Borrower' },
        { key: 'collegeId', label: 'Student ID' },
        { key: 'department', label: 'Department' },
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time Slot' },
        { key: 'status', label: 'Status' },
        { key: 'purpose', label: 'Purpose' },
      ]);
      res.header('Content-Type', 'text/csv');
      res.attachment('reservations-report.csv');
      res.send(csv);
      return;
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/inventory
router.get('/inventory', authenticate, isTechnicianOrAdmin, async (req, res, next) => {
  try {
    const items = await InventoryItem.find().lean();
    const formatted = items.map((item) => ({
      code: item.componentCode,
      name: item.name,
      category: item.category,
      partNumber: item.partNumber,
      quantity: item.quantity,
      unit: item.unit,
      minimumStock: item.minimumStock,
      isLowStock: item.quantity <= item.minimumStock ? 'YES' : 'NO',
      location: item.storageLocation,
      cost: item.cost || 0,
    }));

    if (req.query.format === 'csv') {
      const csv = jsonToCSV(formatted, [
        { key: 'code', label: 'Component Code' },
        { key: 'name', label: 'Component Name' },
        { key: 'category', label: 'Category' },
        { key: 'partNumber', label: 'Part Number' },
        { key: 'quantity', label: 'Quantity In Stock' },
        { key: 'unit', label: 'Unit' },
        { key: 'minimumStock', label: 'Minimum Stock' },
        { key: 'isLowStock', label: 'Low Stock Alert' },
        { key: 'location', label: 'Storage Location' },
        { key: 'cost', label: 'Unit Cost ($)' },
      ]);
      res.header('Content-Type', 'text/csv');
      res.attachment('inventory-stock-report.csv');
      res.send(csv);
      return;
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/maintenance
router.get('/maintenance', authenticate, isTechnicianOrAdmin, async (req, res, next) => {
  try {
    const items = await Maintenance.find()
      .populate('equipment', 'name equipmentCode')
      .populate('technician', 'fullName')
      .lean();

    const formatted = items.map((m) => ({
      equipment: (m.equipment as any)?.name || 'Unknown',
      code: (m.equipment as any)?.equipmentCode || '',
      type: m.maintenanceType,
      technician: (m.technician as any)?.fullName || 'Unassigned',
      status: m.status,
      cost: m.cost,
      description: m.description,
      startDate: m.startDate,
      completionDate: m.completionDate || 'In Progress',
    }));

    if (req.query.format === 'csv') {
      const csv = jsonToCSV(formatted, [
        { key: 'equipment', label: 'Equipment' },
        { key: 'code', label: 'Code' },
        { key: 'type', label: 'Type' },
        { key: 'technician', label: 'Technician' },
        { key: 'status', label: 'Status' },
        { key: 'cost', label: 'Cost ($)' },
        { key: 'description', label: 'Description' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'completionDate', label: 'Completion Date' },
      ]);
      res.header('Content-Type', 'text/csv');
      res.attachment('maintenance-log-report.csv');
      res.send(csv);
      return;
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

export default router;
