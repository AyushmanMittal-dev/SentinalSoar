import mongoose from 'mongoose'
import { env } from './validateEnv'
import { logger } from '../utils/logger'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod: MongoMemoryServer | null = null

export async function connectDB(retries = MAX_RETRIES): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    logger.info('✅ MongoDB connected')
  } catch (error) {
    if (retries > 0) {
      logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} attempts left)`)
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
      return connectDB(retries - 1)
    }
    logger.warn('⚠️ Local MongoDB connection failed after all retries. Falling back to in-memory MongoDB for testing...')
    
    try {
      mongod = await MongoMemoryServer.create()
      const uri = mongod.getUri()
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      logger.info('✅ In-memory MongoDB connected')
    } catch (memError) {
      logger.error('❌ In-memory MongoDB connection failed', { error: memError })
      process.exit(1)
    }
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — attempting reconnect...')
})

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error', { error: err.message })
})
