import mongoose, { Schema, Document } from 'mongoose';

export type CheckoutStatus = 'CHECKED_OUT' | 'RETURNED' | 'OVERDUE' | 'DAMAGED_RETURN';

export interface ICheckout extends Document {
  equipment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  reservation?: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  checkoutTime: Date;
  expectedReturnTime: Date;
  actualReturnTime?: Date;
  receivedBy?: mongoose.Types.ObjectId;
  conditionBefore: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  conditionAfter?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  damageReported?: boolean;
  damageNotes?: string;
  notes?: string;
  status: CheckoutStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutSchema = new Schema<ICheckout>(
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
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkoutTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expectedReturnTime: {
      type: Date,
      required: true,
      index: true,
    },
    actualReturnTime: {
      type: Date,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    conditionBefore: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'],
      default: 'GOOD',
    },
    conditionAfter: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'],
    },
    damageReported: {
      type: Boolean,
      default: false,
    },
    damageNotes: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['CHECKED_OUT', 'RETURNED', 'OVERDUE', 'DAMAGED_RETURN'],
      default: 'CHECKED_OUT',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Checkout = mongoose.model<ICheckout>('Checkout', CheckoutSchema);
