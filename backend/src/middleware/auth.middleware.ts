import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/validateEnv'
import { redis, REDIS_KEYS } from '../config/redis'
import { UnauthorizedError, ForbiddenError } from '../utils/AppError'

export interface JwtPayload {
  userId: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload

    // Check if session is active in Redis
    const sessionActive = await redis.get(REDIS_KEYS.session(payload.userId))
    if (!sessionActive) {
      return next(new UnauthorizedError('Session expired or revoked. Please log in again.'))
    }

    req.user = payload
    next()
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'))
  }
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'))
    }
    next()
  }
}
