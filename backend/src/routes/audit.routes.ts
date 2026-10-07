import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.middleware'
import { AuditLog } from '../models/AuditLog'

const router = Router()

// Get audit logs (Admin only)
router.get('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  
  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    
  const total = await AuditLog.countDocuments()
  
  res.json({ 
    success: true, 
    data: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const auditRouter = router
