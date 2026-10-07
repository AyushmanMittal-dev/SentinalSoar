import { Router, Request, Response } from 'express'
import { Incident } from '../models/Incident'
import { Alert } from '../models/Alert'
import { requireAuth } from '../middleware/auth.middleware'
import { auditRequest } from '../middleware/audit.middleware'
import { incidentFilterSchema } from '../utils/validators'
import { NotFoundError } from '../utils/AppError'

const router = Router()

// Get paginated list of incidents
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const query = incidentFilterSchema.parse(req.query)
  const skip = (query.page - 1) * query.limit

  const filter: Record<string, any> = {}
  if (query.status) filter.status = query.status
  if (query.severity) filter.severity = query.severity
  if (query.attackType) filter.attackType = query.attackType
  if (query.search) {
    filter.$or = [
      { incidentNumber: { $regex: query.search, $options: 'i' } },
      { title: { $regex: query.search, $options: 'i' } },
      { sourceIPs: { $regex: query.search, $options: 'i' } },
    ]
  }

  const [incidents, total] = await Promise.all([
    Incident.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .select('-aiAnalysis.rawResponse'), // Exclude heavy raw response
    Incident.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: incidents,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit)
    }
  })
})

// Get single incident details with alerts
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const incident = await Incident.findById(req.params.id)
    .populate({
      path: 'alertIds',
      select: 'source fileName createdAt normalizedData',
      options: { sort: { createdAt: -1 }, limit: 100 } // Limit to top 100 alerts for perf
    })
    .populate('actionIds')
    .populate('assignedTo', 'name email avatar')

  if (!incident) throw new NotFoundError('Incident not found')

  res.json({ success: true, data: incident })
})

// Update incident status/assignment
router.patch(
  '/:id',
  requireAuth,
  auditRequest('INCIDENT_UPDATED', 'incident'),
  async (req: Request, res: Response) => {
    const { status, assignedTo, notes } = req.body
    const update: any = {}
    
    if (status) {
      update.status = status
      if (['resolved', 'false_positive'].includes(status)) {
        update.resolvedAt = new Date()
      }
    }
    if (assignedTo) update.assignedTo = assignedTo
    if (notes) update.notes = notes

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    )

    if (!incident) throw new NotFoundError('Incident not found')

    res.json({ success: true, data: incident })
  }
)

export const incidentRouter = router
