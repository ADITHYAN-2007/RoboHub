import mongoose, { Schema, Document } from 'mongoose';

export type ProjectStatus =
  | 'IDEA'
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'COMPLETED'
  | 'ARCHIVED';

export type TeamMemberRole =
  | 'TEAM_LEAD'
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'MECHANICAL'
  | 'RESEARCH'
  | 'DOCUMENTATION';

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: TeamMemberRole;
  joinedAt: Date;
}

export interface IProject extends Document {
  projectCode: string;
  projectName: string;
  problemStatement: string;
  description: string;
  objectives: string[];
  category: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  facultyMentor?: mongoose.Types.ObjectId;
  teamMembers: IProjectMember[];
  budget: number;
  progress: number; // 0 to 100
  repositoryUrl?: string;
  documentation?: { title: string; url: string }[];
  images?: string[];
  demoVideo?: string;
  feedback?: { faculty: mongoose.Types.ObjectId; text: string; date: Date }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['TEAM_LEAD', 'HARDWARE', 'SOFTWARE', 'MECHANICAL', 'RESEARCH', 'DOCUMENTATION'],
      default: 'HARDWARE',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    problemStatement: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    objectives: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
      default: 'Autonomous Robotics',
    },
    status: {
      type: String,
      enum: ['IDEA', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'ARCHIVED'],
      default: 'PROPOSED',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    facultyMentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    teamMembers: {
      type: [ProjectMemberSchema],
      default: [],
    },
    budget: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    repositoryUrl: {
      type: String,
      default: '',
    },
    documentation: [
      {
        title: String,
        url: String,
      },
    ],
    images: {
      type: [String],
      default: [],
    },
    demoVideo: {
      type: String,
      default: '',
    },
    feedback: [
      {
        faculty: { type: Schema.Types.ObjectId, ref: 'User' },
        text: String,
        date: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ projectName: 'text', description: 'text', problemStatement: 'text' });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface IProjectMilestone extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  progress: number;
  assignedMembers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMilestoneSchema = new Schema<IProjectMilestone>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
      default: 'PENDING',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ProjectMilestone = mongoose.model<IProjectMilestone>(
  'ProjectMilestone',
  ProjectMilestoneSchema
);
