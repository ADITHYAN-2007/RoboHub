import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyDocument extends Document {
  code: string;
  title: string;
  category: string;
  version: string;
  summary: string;
  rules: string[];
  emergencyProcedures: string[];
  requiredForCategories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyDocumentSchema = new Schema<ISafetyDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0',
    },
    summary: {
      type: String,
      required: true,
    },
    rules: {
      type: [String],
      default: [],
    },
    emergencyProcedures: {
      type: [String],
      default: [],
    },
    requiredForCategories: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SafetyDocument = mongoose.model<ISafetyDocument>('SafetyDocument', SafetyDocumentSchema);

export interface ISafetyAcknowledgement extends Document {
  user: mongoose.Types.ObjectId;
  safetyDocument: mongoose.Types.ObjectId;
  version: string;
  acknowledgedAt: Date;
}

const SafetyAcknowledgementSchema = new Schema<ISafetyAcknowledgement>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    safetyDocument: {
      type: Schema.Types.ObjectId,
      ref: 'SafetyDocument',
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const SafetyAcknowledgement = mongoose.model<ISafetyAcknowledgement>(
  'SafetyAcknowledgement',
  SafetyAcknowledgementSchema
);

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type:
    | 'RESERVATION_APPROVED'
    | 'RESERVATION_REJECTED'
    | 'RESERVATION_REMINDER'
    | 'EQUIPMENT_DUE'
    | 'LATE_RETURN'
    | 'MAINTENANCE_REQUIRED'
    | 'ISSUE_UPDATE'
    | 'LOW_INVENTORY'
    | 'PROJECT_APPROVED'
    | 'PROJECT_FEEDBACK'
    | 'TEAM_INVITATION'
    | 'SAFETY_REMINDER'
    | 'SYSTEM_ALERT';
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'ROLE_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'EQUIPMENT_CREATED'
  | 'EQUIPMENT_UPDATED'
  | 'EQUIPMENT_STATUS_CHANGED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'CHECKOUT'
  | 'CHECKIN'
  | 'INVENTORY_CREATED'
  | 'INVENTORY_UPDATED'
  | 'INVENTORY_ADJUSTED'
  | 'COMPONENT_REQUEST_CREATED'
  | 'COMPONENT_REQUEST_APPROVED'
  | 'COMPONENT_REQUEST_ISSUED'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_COMPLETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'ISSUE_CREATED'
  | 'ISSUE_RESOLVED'
  | 'SAFETY_ACKNOWLEDGED';

export interface IAuditLog extends Document {
  actor?: mongoose.Types.ObjectId;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    details: {
      type: String,
      default: '',
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export interface ISystemSetting extends Document {
  key: string;
  value: string;
  category: string;
  description: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
