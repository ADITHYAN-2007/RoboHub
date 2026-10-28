import mongoose, { Schema, Document } from 'mongoose';

export type EquipmentCategory =
  | 'Robotic Arms'
  | 'Mobile Robots'
  | 'Drones'
  | 'Arduino'
  | 'Raspberry Pi'
  | 'ESP32'
  | 'Sensors'
  | 'Motors'
  | 'Motor Drivers'
  | 'PLC'
  | 'CNC'
  | '3D Printers'
  | 'Cameras'
  | 'LiDAR'
  | 'Batteries'
  | 'Controllers'
  | 'Microcontrollers'
  | 'Power Supplies'
  | 'Tools'
  | 'Other';

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'UNDER_MAINTENANCE'
  | 'DAMAGED'
  | 'LOST'
  | 'RETIRED';

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';

export interface IEquipment {
  _id?: mongoose.Types.ObjectId;
  equipmentCode: string;
  assetTag: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiry?: Date;
  laboratory: mongoose.Types.ObjectId;
  room?: mongoose.Types.ObjectId;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  specifications: Record<string, string>;
  image?: string;
  documents?: { name: string; url: string; type: string }[];
  maintenanceIntervalDays: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  safetyDocumentRequired?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  qrCodeData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    equipmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    assetTag: {
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
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    purchaseDate: {
      type: Date,
    },
    purchaseCost: {
      type: Number,
      default: 0,
    },
    warrantyExpiry: {
      type: Date,
    },
    laboratory: {
      type: Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED'],
      default: 'AVAILABLE',
      index: true,
    },
    condition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'],
      default: 'EXCELLENT',
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    image: {
      type: String,
      default: '',
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    maintenanceIntervalDays: {
      type: Number,
      default: 90,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    safetyDocumentRequired: {
      type: Schema.Types.ObjectId,
      ref: 'SafetyDocument',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    qrCodeData: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

EquipmentSchema.index({ name: 'text', description: 'text', manufacturer: 'text', model: 'text' });

export const Equipment = mongoose.model<IEquipment>('Equipment', EquipmentSchema);
