import { AuditLog, type AuditAction } from '../models/SafetyAndAudit.js';
import type { Request } from 'express';
import mongoose from 'mongoose';

export interface AuditLogOptions {
  actor?: mongoose.Types.ObjectId | string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string;
  before?: any;
  after?: any;
  req?: Request;
}

export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    const ip = options.req ? (options.req.headers['x-forwarded-for'] as string) || options.req.ip || '127.0.0.1' : '127.0.0.1';
    const userAgent = options.req ? (options.req.headers['user-agent'] as string) || '' : '';

    await AuditLog.create({
      actor: options.actor ? new mongoose.Types.ObjectId(options.actor.toString()) : undefined,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      details: options.details || '',
      before: options.before,
      after: options.after,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
