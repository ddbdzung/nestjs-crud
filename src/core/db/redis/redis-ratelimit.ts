import { Redis } from 'ioredis'
import { ClsService } from 'nestjs-cls'

import { config } from '@config'
import { AppLogger } from '@core'

export async function createRedisRateLimit(
  cls?: ClsService,
  logger?: AppLogger
) {
  const redisClient = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: true, // Enable offline queue to handle Redis disconnections
    keepAlive: 30000,
  })

  // Tạo logger mới với context riêng nếu chưa có
  const rateLimitLogger =
    logger || (cls ? AppLogger.create(cls, 'RedisRateLimit') : undefined)

  if (rateLimitLogger) {
    // Add error handling for ioredis client
    redisClient.on('error', (error) => {
      rateLimitLogger.error(
        'Rate limit Redis client error:',
        error instanceof Error ? error : new Error(String(error))
      )
      // Don't throw error, let skipOnError handle it
    })

    redisClient.on('connect', () => {
      rateLimitLogger.log('Rate limit Redis client connected')
    })

    redisClient.on('ready', () => {
      rateLimitLogger.log('Rate limit Redis client ready')
    })

    redisClient.on('close', () => {
      rateLimitLogger.error('Rate limit Redis client connection closed')
    })

    redisClient.on('reconnecting', (ms: number) => {
      rateLimitLogger.log(`Rate limit Redis client reconnecting in ${ms}ms`)
    })
  }

  try {
    await redisClient.connect()
    if (rateLimitLogger)
      rateLimitLogger.log('Rate limit Redis client connected successfully')
  } catch (error) {
    if (rateLimitLogger)
      rateLimitLogger.error(
        'Failed to connect to Redis for rate limiting, will skip rate limiting:',
        error instanceof Error ? error : new Error(String(error))
      )
  }

  return redisClient
}
