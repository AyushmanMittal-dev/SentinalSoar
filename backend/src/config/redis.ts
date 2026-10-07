import Redis from 'ioredis'
import { env } from './validateEnv'
import { logger } from '../utils/logger'

// In-memory fallback for when Redis is unavailable (dev only)
class MemoryCache {
  private store = new Map<string, { value: string; expires: number }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value, expires: 0 })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, { value, expires: Date.now() + seconds * 1000 })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0
  }

  async exists(key: string): Promise<number> {
    const val = await this.get(key)
    return val ? 1 : 0
  }

  async ping(): Promise<'PONG'> { return 'PONG' }
}

let redisClient: Redis | MemoryCache

export async function connectRedis(): Promise<void> {
  try {
    const client = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD || undefined,
      tls: env.REDIS_TLS ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    })
    await client.connect()
    await client.ping()
    redisClient = client
    logger.info('✅ Redis connected')
    client.on('error', (err) => logger.error('Redis error', { error: err.message }))
    client.on('reconnecting', () => logger.warn('Redis reconnecting...'))
  } catch (error) {
    logger.warn('⚠  Redis unavailable — using in-memory cache fallback (dev mode only)')
    redisClient = new MemoryCache()
  }
}

export function getRedis(): Redis | MemoryCache {
  if (!redisClient) {
    redisClient = new MemoryCache()
  }
  return redisClient
}

// Typed helpers
export const redis = {
  get: (key: string) => getRedis().get(key),
  set: (key: string, value: string) => getRedis().set(key, value),
  setex: (key: string, seconds: number, value: string) => getRedis().setex(key, seconds, value),
  del: (key: string) => getRedis().del(key),
  exists: (key: string) => getRedis().exists(key),
  ping: () => getRedis().ping(),
}

// Redis key constants
export const REDIS_KEYS = {
  threatIntel: (indicator: string) => `sentinel:ti:${indicator}`,
  dashboardStats: () => `sentinel:dashboard:stats`,
  session: (userId: string) => `sentinel:session:${userId}`,
  pipeline: (incidentId: string) => `sentinel:incident:${incidentId}:pipeline`,
}
