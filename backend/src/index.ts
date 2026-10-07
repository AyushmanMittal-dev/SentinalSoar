import 'express-async-errors' // Must be at top
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'

import { env } from './config/validateEnv'
import { connectDB } from './config/db'
import { connectRedis } from './config/redis'
import { logger, httpLogStream } from './utils/logger'

import { errorHandler } from './middleware/errorHandler'
import { globalRateLimiter } from './middleware/rateLimiter'

import { authRouter } from './routes/auth.routes'
import { alertRouter } from './routes/alert.routes'
import { incidentRouter } from './routes/incident.routes'
import { dashboardRouter } from './routes/dashboard.routes'
import { playbookRouter } from './routes/playbook.routes'
import { actionRouter } from './routes/action.routes'
import { reportRouter } from './routes/report.routes'
import { auditRouter } from './routes/audit.routes'

const app = express()
const server = http.createServer(app)

// Socket.IO Setup
export const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`)
  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`)
  })
})

// Middleware
app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(compression())
app.use(morgan('combined', { stream: httpLogStream }))
app.use(globalRateLimiter)

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/alerts', alertRouter)
app.use('/api/v1/incidents', incidentRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/playbooks', playbookRouter)
app.use('/api/v1/actions', actionRouter)
app.use('/api/v1/reports', reportRouter)
app.use('/api/v1/audit', auditRouter)

// Error Handler
app.use(errorHandler)



// Startup
async function startServer() {
  await connectDB()
  await connectRedis()

  server.listen(env.PORT, () => {
    logger.info(`🚀 SentinelSOAR API running on port ${env.PORT} in ${env.NODE_ENV} mode`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...')
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err)
  process.exit(1)
})
