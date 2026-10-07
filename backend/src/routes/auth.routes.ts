import { Router, Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { loginSchema, registerSchema, changePasswordSchema } from '../utils/validators'
import { requireAuth } from '../middleware/auth.middleware'
import { auditRequest } from '../middleware/audit.middleware'
import { authRateLimiter } from '../middleware/rateLimiter'
import { env } from '../config/validateEnv'

const router = Router()

// Attach body to request for audit
const getEmail = (req: Request) => req.body.email

router.post(
  '/register',
  authRateLimiter,
  auditRequest('USER_REGISTERED', 'auth', getEmail),
  async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body)
    const user = await authService.register(data)
    res.status(201).json({ success: true, data: user })
  }
)

router.post(
  '/login',
  authRateLimiter,
  auditRequest('USER_LOGIN', 'auth', getEmail),
  async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body)
    const result = await authService.login(data.email, data.password)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    })
  }
)

router.post(
  '/refresh',
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken
    const result = await authService.refresh(refreshToken)
    res.json({ success: true, data: result })
  }
)

router.post(
  '/logout',
  requireAuth,
  auditRequest('USER_LOGOUT', 'auth'),
  async (req: Request, res: Response) => {
    await authService.logout(req.user!.userId)
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out successfully' })
  }
)

router.post(
  '/change-password',
  requireAuth,
  auditRequest('PASSWORD_CHANGED', 'auth'),
  async (req: Request, res: Response) => {
    const data = changePasswordSchema.parse(req.body)
    await authService.changePassword(req.user!.userId, data.oldPassword, data.newPassword)
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Password changed. Please log in again.' })
  }
)

export const authRouter = router
