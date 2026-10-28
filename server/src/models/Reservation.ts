import mongoose, { Schema, Document } from 'mongoose';

export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface IReservation extends Document {
  equipment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDateTime: Date;
  endDateTime: Date;
  purpose: string;
  project?: mongoose.Types.ObjectId;
  status: ReservationStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED', 'NO_SHOW'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
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

ReservationSchema.index({ equipment: 1, startDateTime: 1, endDateTime: 1, status: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
