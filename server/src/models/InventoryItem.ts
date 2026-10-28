import mongoose, { Schema, Document } from 'mongoose';

export type InventoryCategory =
  | 'Resistors'
  | 'Capacitors'
  | 'LEDs'
  | 'Sensors'
  | 'Motors'
  | 'Motor Drivers'
  | 'ICs'
  | 'Wires'
  | 'Connectors'
  | 'Batteries'
  | 'Screws'
  | 'Mechanical Parts'
  | 'PCB'
  | 'Arduino Accessories'
  | 'Raspberry Pi Accessories'
  | 'Other';

export interface IInventoryItem extends Document {
  componentCode: string;
  name: string;
  category: InventoryCategory;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string; // pcs, reels, meters, sets
  storageLocation: string; // Drawer B-14, Shelf 3
  supplier?: string;
  purchaseDate?: Date;
  cost?: number;
  condition: 'NEW' | 'REFURBISHED' | 'TESTED';
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    componentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    partNumber: {
      type: String,
      default: '',
      trim: true,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    minimumStock: {
      type: Number,
      required: true,
      default: 10,
    },
    maximumStock: {
      type: Number,
      default: 500,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    storageLocation: {
      type: String,
      required: true,
      trim: true,
    },
    supplier: {
      type: String,
      default: '',
    },
    purchaseDate: {
      type: Date,
    },
    cost: {
      type: Number,
      default: 0,
    },
    condition: {
      type: String,
      enum: ['NEW', 'REFURBISHED', 'TESTED'],
      default: 'NEW',
    },
  },
  {
    timestamps: true,
  }
);

InventoryItemSchema.index({ name: 'text', partNumber: 'text', category: 'text' });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

export type TransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'DAMAGED'
  | 'RETURNED';

export interface IInventoryTransaction extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  quantity: number;
  type: TransactionType;
  reason: string;
  user: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  previousQuantity: number;
  newQuantity: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGED', 'RETURNED'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);

export type ComponentRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PARTIALLY_APPROVED'
  | 'ISSUED'
  | 'RETURNED';

export interface IComponentRequest extends Document {
  project?: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  component: mongoose.Types.ObjectId;
  requestedQuantity: number;
  approvedQuantity?: number;
  reason: string;
  requiredDate: Date;
  status: ComponentRequestStatus;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentRequestSchema = new Schema<IComponentRequest>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    component: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    approvedQuantity: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    requiredDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_APPROVED', 'ISSUED', 'RETURNED'],
      default: 'PENDING',
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const ComponentRequest = mongoose.model<IComponentRequest>(
  'ComponentRequest',
  ComponentRequestSchema
);
