import mongoose, { Schema, Document } from 'mongoose';

export interface ILaboratory extends Document {
  name: string;
  code: string;
  building: string;
  description: string;
  manager: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const LaboratorySchema = new Schema<ILaboratory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Laboratory = mongoose.model<ILaboratory>('Laboratory', LaboratorySchema);

export interface IRoom extends Document {
  roomNumber: string;
  name: string;
  building: string;
  capacity: number;
  openingHours: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLOSED';
  laboratory?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 20,
    },
    openingHours: {
      type: String,
      default: '08:00 AM - 09:00 PM',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED'],
      default: 'AVAILABLE',
    },
    laboratory: {
      type: Schema.Types.ObjectId,
      ref: 'Laboratory',
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
