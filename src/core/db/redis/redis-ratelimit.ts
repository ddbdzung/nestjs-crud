import { config } from '@config'
import { Redis } from 'ioredis'
import { ClsService } from 'nestjs-cls'

import { generateRedisURI } from '@/config/config.helper'

import { AppLogger } from '@/core/logger'

export async function createRedisRateLimit(
  cls?: ClsService,
  logger?: AppLogger
) {
  let redisUri = config.REDIS_URI
  if (!redisUri) {
    redisUri = generateRedisURI(config)
  }
  const redisClient = new Redis(redisUri, {
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: true, // Enable offline queue to handle Redis disconnections
    keepAlive: 30000,
    retryStrategy: (times) => {
      if (times > 10) return null
      return Math.min(times * 500, 5000)
    },
  })

  const rateLimitLogger =
    logger || (cls ? AppLogger.create(cls, 'RedisRateLimit') : undefined)

  if (rateLimitLogger) {
    let lastErrorLoggedAt = 0
    let suppressedErrors = 0

    const logErrorThrottled = (error: unknown) => {
      const now = Date.now()
      if (now - lastErrorLoggedAt > 30000) {
        if (suppressedErrors > 0) {
          rateLimitLogger.warn(
            `Rate limit Redis errors suppressed: ${suppressedErrors}`
          )
          suppressedErrors = 0
        }
        lastErrorLoggedAt = now
        rateLimitLogger.error(
          'Rate limit Redis client error:',
          error instanceof Error ? error : new Error(String(error))
        )
      } else {
        suppressedErrors++
      }
    }

    redisClient.on('error', (error) => {
      logErrorThrottled(error)
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
      rateLimitLogger.log(
        `Rate limit Redis client reconnecting in ${ms / 1000} seconds`
      )
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
