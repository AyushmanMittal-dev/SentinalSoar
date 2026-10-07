import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { Playbook } from '../models/Playbook'
import { auditRequest } from '../middleware/audit.middleware'
import { NotFoundError } from '../utils/AppError'

const router = Router()

// Get all playbooks
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const playbooks = await Playbook.find().sort({ isActive: -1, name: 1 })
  res.json({ success: true, data: playbooks })
})

// Create a new playbook
router.post(
  '/',
  requireAuth,
  auditRequest('PLAYBOOK_CREATED', 'playbook'),
  async (req: Request, res: Response) => {
    const playbook = await Playbook.create({
      ...req.body,
      createdBy: req.user!.userId
    })
    res.status(201).json({ success: true, data: playbook })
  }
)

// Update playbook
router.put(
  '/:id',
  requireAuth,
  auditRequest('PLAYBOOK_UPDATED', 'playbook'),
  async (req: Request, res: Response) => {
    const playbook = await Playbook.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!playbook) throw new NotFoundError('Playbook not found')
    res.json({ success: true, data: playbook })
  }
)

// Delete playbook
router.delete(
  '/:id',
  requireAuth,
  auditRequest('PLAYBOOK_DELETED', 'playbook'),
  async (req: Request, res: Response) => {
    const playbook = await Playbook.findByIdAndDelete(req.params.id)
    if (!playbook) throw new NotFoundError('Playbook not found')
    res.json({ success: true, message: 'Playbook deleted' })
  }
)

export const playbookRouter = router
