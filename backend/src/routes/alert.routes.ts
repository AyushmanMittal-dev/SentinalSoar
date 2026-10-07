import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'
import { uploadRateLimiter } from '../middleware/rateLimiter'
import { auditRequest } from '../middleware/audit.middleware'
import { alertIngestionService } from '../services/alertIngestion.service'
import { ValidationError } from '../utils/AppError'

const router = Router()

router.post(
  '/upload',
  requireAuth,
  uploadRateLimiter,
  upload.single('file'),
  auditRequest('ALERT_UPLOADED', 'alert'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    const result = await alertIngestionService.uploadAlert(req.file, req.user!.userId)

    res.status(202).json({
      success: true,
      data: result,
      message: 'File uploaded and ingestion started'
    })
  }
)

export const alertRouter = router
