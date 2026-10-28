import mongoose, { Schema, Document } from 'mongoose';

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'CORRECTIVE'
  | 'INSPECTION'
  | 'CALIBRATION'
  | 'REPAIR';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IMaintenance extends Document {
  equipment: mongoose.Types.ObjectId;
  maintenanceType: MaintenanceType;
  description: string;
  technician?: mongoose.Types.ObjectId;
  startDate: Date;
  completionDate?: Date;
  cost: number;
  partsUsed: string[];
  notes?: string;
  status: MaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
      index: true,
    },
    maintenanceType: {
      type: String,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'REPAIR'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    technician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    completionDate: {
      type: Date,
    },
    cost: {
      type: Number,
      default: 0,
    },
    partsUsed: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Maintenance = mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IIssueReport extends Document {
  equipment: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  category: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  images: string[];
  assignedTechnician?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IssueReportSchema = new Schema<IIssueReport>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Mechanical Failure',
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    assignedTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const IssueReport = mongoose.model<IIssueReport>('IssueReport', IssueReportSchema);
