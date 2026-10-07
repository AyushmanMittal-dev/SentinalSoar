import { Request, Response, NextFunction } from 'express'
import { auditService } from '../services/audit.service'
import { AUDIT_EVENTS } from '../models/AuditLog'

export const auditRequest = (
  action: keyof typeof AUDIT_EVENTS,
  category: 'auth' | 'alert' | 'incident' | 'playbook' | 'automation' | 'report' | 'system',
  getResourceId?: (req: Request, res: Response) => string | undefined
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Intercept response finish to log the outcome
    res.on('finish', () => {
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure'
      const resourceId = getResourceId ? getResourceId(req, res) : req.params.id

      auditService.log({
        userId: req.user?.userId,
        action: AUDIT_EVENTS[action],
        category,
        resourceId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status,
        metadata: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        },
      })
    })
    next()
  }
}
