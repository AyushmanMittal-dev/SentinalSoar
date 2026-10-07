import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { Report } from '../models/Report'
import { reportService } from '../services/report.service'
import { auditRequest } from '../middleware/audit.middleware'

const router = Router()

// Get all reports
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const reports = await Report.find().sort({ generatedAt: -1 })
  res.json({ success: true, data: reports })
})

// Generate new report
router.post(
  '/',
  requireAuth,
  auditRequest('REPORT_GENERATED', 'report'),
  async (req: Request, res: Response) => {
    const { incidentId, type } = req.body
    const report = await reportService.generateReport(incidentId, type, req.user!.userId)
    res.status(201).json({ success: true, data: report })
  }
)

export const reportRouter = router
