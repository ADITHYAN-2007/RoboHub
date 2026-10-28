import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'LAB_ADMIN' | 'FACULTY' | 'LAB_TECHNICIAN' | 'STUDENT';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  collegeId: string;
  role: UserRole;
  department: string;
  year?: string;
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  safetyAcknowledgedDocs: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    collegeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY', 'LAB_TECHNICIAN', 'STUDENT'],
      default: 'STUDENT',
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      default: '1st Year',
    },
    phone: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    safetyAcknowledgedDocs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SafetyDocument',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helper method on schema
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.verificationToken;
  delete obj.verificationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
