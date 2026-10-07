import mongoose from 'mongoose'
import { AuditLog, AuditEventType } from '../models/AuditLog'
import { logger } from '../utils/logger'

interface AuditParams {
  userId?: string
  userEmail?: string
  action: AuditEventType
  category: 'auth' | 'alert' | 'incident' | 'playbook' | 'automation' | 'report' | 'system'
  resourceType?: string
  resourceId?: string
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failure'
  metadata?: Record<string, unknown>
}

class AuditService {
  public async log(params: AuditParams): Promise<void> {
    try {
      await AuditLog.create({
        ...params,
        userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : undefined,
        resourceId: params.resourceId ? new mongoose.Types.ObjectId(params.resourceId) : undefined,
        timestamp: new Date(),
      })
      logger.info(`Audit: ${params.action}`, { userId: params.userId, resourceId: params.resourceId })
    } catch (error) {
      // Fire-and-forget, don't throw to caller
      logger.error('Failed to write audit log', { error, params })
    }
  }
}

export const auditService = new AuditService()
