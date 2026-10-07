import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'
import { env } from '../config/validateEnv'
import { redis, REDIS_KEYS } from '../config/redis'
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/AppError'

class AuthService {
  public async register(data: Partial<IUser>) {
    const exists = await User.findOne({ email: data.email })
    if (exists) {
      throw new ValidationError('Email already registered')
    }

    const passwordHash = await bcrypt.hash(data.passwordHash as string, 12)
    
    const user = await User.create({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || 'analyst'
    })

    return user.toJSON()
  }

  public async login(email: string, password: string) {
    const user = await User.findOne({ email, isActive: true })
    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any }
    )

    const refreshToken = jwt.sign(
      { userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any }
    )

    // Set session in Redis (7 days TTL)
    await redis.setex(REDIS_KEYS.session(user._id.toString()), 604800, 'active')

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

    return {
      accessToken,
      refreshToken,
      user: user.toJSON()
    }
  }

  public async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string }
      
      const sessionActive = await redis.get(REDIS_KEYS.session(decoded.userId))
      if (!sessionActive) {
        throw new UnauthorizedError('Session revoked')
      }

      const user = await User.findById(decoded.userId)
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User inactive')
      }

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRY as any }
      )

      return { accessToken }
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token')
    }
  }

  public async logout(userId: string) {
    await redis.del(REDIS_KEYS.session(userId))
  }

  public async changePassword(userId: string, oldPw: string, newPw: string) {
    const user = await User.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const isValid = await bcrypt.compare(oldPw, user.passwordHash)
    if (!isValid) throw new ValidationError('Incorrect old password')

    const passwordHash = await bcrypt.hash(newPw, 12)
    await User.updateOne({ _id: userId }, { passwordHash })
    
    // Revoke session forcing re-login
    await redis.del(REDIS_KEYS.session(userId))
  }
}

export const authService = new AuthService()
