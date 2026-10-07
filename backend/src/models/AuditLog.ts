import mongoose, { Document, Schema } from 'mongoose'

export const AUDIT_EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ALERT_UPLOADED: 'ALERT_UPLOADED',
  ALERT_DELETED: 'ALERT_DELETED',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_UPDATED: 'INCIDENT_UPDATED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  INCIDENT_ASSIGNED: 'INCIDENT_ASSIGNED',
  THREATINTEL_FETCHED: 'THREATINTEL_FETCHED',
  AI_ANALYSIS_RUN: 'AI_ANALYSIS_RUN',
  PLAYBOOK_CREATED: 'PLAYBOOK_CREATED',
  PLAYBOOK_UPDATED: 'PLAYBOOK_UPDATED',
  PLAYBOOK_DELETED: 'PLAYBOOK_DELETED',
  AUTOMATION_STARTED: 'AUTOMATION_STARTED',
  AUTOMATION_COMPLETED: 'AUTOMATION_COMPLETED',
  AUTOMATION_FAILED: 'AUTOMATION_FAILED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
} as const

export type AuditEventType = keyof typeof AUDIT_EVENTS

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId
  userEmail?: string
  action: string
  category: 'auth' | 'alert' | 'incident' | 'playbook' | 'automation' | 'report' | 'system'
  resourceType?: string
  resourceId?: mongoose.Types.ObjectId
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  metadata?: Record<string, unknown>
  timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  userEmail: String,
  action: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['auth', 'alert', 'incident', 'playbook', 'automation', 'report', 'system'],
    default: 'system',
    index: true,
  },
  resourceType: String,
  resourceId: Schema.Types.ObjectId,
  previousValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  metadata: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, index: true },
})

AuditLogSchema.index({ timestamp: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
