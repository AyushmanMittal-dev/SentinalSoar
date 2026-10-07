import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { Incident } from '../models/Incident'
import { redis, REDIS_KEYS } from '../config/redis'

const router = Router()

router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  const cacheKey = REDIS_KEYS.dashboardStats()
  const cached = await redis.get(cacheKey)
  if (cached) {
    return res.json({ success: true, data: JSON.parse(cached) })
  }

  const [
    totalIncidents,
    openIncidents,
    criticalIncidents,
    severityBreakdown,
    statusBreakdown,
    attackTypeBreakdown,
    recentIncidents
  ] = await Promise.all([
    Incident.countDocuments(),
    Incident.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Incident.countDocuments({ status: { $in: ['open', 'in_progress'] }, severity: 'critical' }),
    Incident.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $group: { _id: '$attackType', count: { $sum: 1 } } }]),
    Incident.find().sort({ createdAt: -1 }).limit(5).select('incidentNumber title severity status attackType createdAt')
  ])

  const formatAggregation = (agg: any[]) => agg.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})

  const stats = {
    overview: { totalIncidents, openIncidents, criticalIncidents },
    severity: formatAggregation(severityBreakdown),
    status: formatAggregation(statusBreakdown),
    attackTypes: formatAggregation(attackTypeBreakdown),
    recentIncidents
  }

  // Cache for 1 minute
  await redis.setex(cacheKey, 60, JSON.stringify(stats))

  res.json({ success: true, data: stats })
})

export const dashboardRouter = router
