import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { Action } from '../models/Action'

const router = Router()

// Get all actions for an incident
router.get('/incident/:incidentId', requireAuth, async (req: Request, res: Response) => {
  const actions = await Action.find({ incidentId: req.params.incidentId }).sort({ executedAt: 1 })
  res.json({ success: true, data: actions })
})

export const actionRouter = router
