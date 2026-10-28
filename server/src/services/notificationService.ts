import { Notification } from '../models/SafetyAndAudit.js';
import { User, type UserRole } from '../models/User.js';
import mongoose from 'mongoose';

export interface SendNotificationOptions {
  recipientId?: mongoose.Types.ObjectId | string;
  recipientRoles?: UserRole[];
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
}

export async function sendNotification(options: SendNotificationOptions): Promise<void> {
  try {
    const recipients: mongoose.Types.ObjectId[] = [];

    if (options.recipientId) {
      recipients.push(new mongoose.Types.ObjectId(options.recipientId.toString()));
    }

    if (options.recipientRoles && options.recipientRoles.length > 0) {
      const users = await User.find({ role: { $in: options.recipientRoles }, isActive: true }).select('_id');
      for (const u of users) {
        if (!recipients.some((r) => r.equals(u._id as mongoose.Types.ObjectId))) {
          recipients.push(u._id as mongoose.Types.ObjectId);
        }
      }
    }

    if (recipients.length === 0) return;

    const docs = recipients.map((r) => ({
      recipient: r,
      title: options.title,
      message: options.message,
      type: options.type,
      link: options.link || '',
      isRead: false,
    }));

    await Notification.insertMany(docs);
  } catch (err) {
    console.error('[NotificationService] Failed to send notification:', err);
  }
}
