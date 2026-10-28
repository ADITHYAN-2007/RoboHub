import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  sessionToken: string;
  refreshTokenHash: string;
  device: string;
  browser: string;
  ip: string;
  lastActiveAt: Date;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      default: 'Unknown Device',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);
