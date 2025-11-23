import { config } from '@config'
import Redis, { RedisOptions } from 'ioredis'

import { generateRedisURI } from '@/config/config.helper'

import { AppLogger } from '@/core/logger'

export const reconnectStrategy = (retries: number) => {
  if (retries > 50) {
    throw new Error('Redis limit retry connection')
  } else if (retries > 25) {
    return 30_000
  }
  if (retries > 10) {
    return 15_000
  }
  return 5_000
}

export class RedisClientExtend {
  public readonly store: Redis & RedisClientExtend
  private readonly redisInstance: Redis

  constructor(
    protected readonly logger: AppLogger,
    protected readonly options: RedisOptions
  ) {
    // Logger đã có context từ constructor, không cần setContext
    let redisUri = config.REDIS_URI
    if (!redisUri) {
      redisUri = generateRedisURI(config)
    }
    const parsedDb =
      typeof options.db === 'number'
        ? options.db
        : Number.isFinite(Number(options.db))
          ? Number(options.db)
          : undefined

    this.redisInstance = new Redis(redisUri, {
      retryStrategy: (times) => reconnectStrategy(times),
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      keepAlive: 30000,
      keyPrefix: config.REDIS_KEY_PREFIX,
      db:
        parsedDb !== undefined && parsedDb >= 0 && Number.isInteger(parsedDb)
          ? parsedDb
          : undefined,
      ...options,
    })

    const combined = Object.create(this.redisInstance)
    Object.setPrototypeOf(combined, this.redisInstance)

    // Add custom methods here
    combined.set = this.set.bind(this)
    combined.get = this.get.bind(this)
    combined.del = this.del.bind(this)

    this.store = combined

    let lastErrorLoggedAt = 0
    let suppressedErrors = 0

    const logErrorThrottled = (error: Error) => {
      const now = Date.now()
      if (now - lastErrorLoggedAt > 30000) {
        if (suppressedErrors > 0) {
          this.logger.warn(`Redis errors suppressed: ${suppressedErrors}`)
          suppressedErrors = 0
        }
        lastErrorLoggedAt = now
        this.logger.error(`Redis error: ${error?.message}`, error)
      } else {
        suppressedErrors++
      }
    }

    let dbSelectionDisabled = false

    this.redisInstance.on('error', (error: Error) => {
      if (
        !dbSelectionDisabled &&
        error?.message?.includes('DB index is out of range')
      ) {
        dbSelectionDisabled = true
        this.logger.warn(
          `Redis DB index ${this.options.db} not supported, falling back to 0`
        )
        this.redisInstance.options.db = 0
        return
      }
      logErrorThrottled(error)
    })

    this.redisInstance.on('connect', () => {
      this.logger.log(`Redis connected: ${this.options.db}`)
    })

    this.redisInstance.on('ready', () => {
      this.logger.log(`Redis ready: ${this.options.db}`)
    })

    this.redisInstance.on('close', () => {
      this.logger.error(`Redis connection closed: ${this.options.db}`)
    })

    this.redisInstance.on('reconnecting', (ms: number) => {
      this.logger.log(
        `Redis reconnecting in ${ms / 1000} seconds: ${this.options.db}`
      )
    })
  }

  /**
   * @param {number} [ttl] - Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await this.store.setex(key, ttl, serialized)
    } else {
      await this.store.set(key, serialized)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.store.get(key)
    return value ? JSON.parse(value) : null
  }

  async del(key: string): Promise<void> {
    await this.store.del(key)
  }

  async delByPattern(pattern: string): Promise<number> {
    const keys: string[] = []
    const stream = this.redisInstance.scanStream({
      match: pattern,
      count: 100,
    })

    return new Promise((resolve, reject) => {
      stream.on('data', (foundKeys: string[]) => {
        keys.push(...foundKeys)
      })

      stream.on('end', async () => {
        if (keys.length === 0) {
          resolve(0)
          return
        }
        try {
          const deleted = await this.redisInstance.del(...keys)
          resolve(deleted)
        } catch (error) {
          reject(error)
        }
      })

      stream.on('error', (error: Error) => {
        reject(error)
      })
    })
  }
}

export type RedisClient = Redis & RedisClientExtend

export interface GetKeyOptions {
  model?: string
  alias: string
  userId?: string
  queryParams?: Record<string, any>
}

export function getKey(options: GetKeyOptions): string {
  const { model, alias, userId, queryParams } = options
  const parts: string[] = []

  if (model) parts.push(model)
  if (alias) parts.push(alias)
  if (userId) parts.push(userId)
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryStr = JSON.stringify(queryParams)
    parts.push(Buffer.from(queryStr).toString('base64'))
  }

  return parts.join(':')
}
