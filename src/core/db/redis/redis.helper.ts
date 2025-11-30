import Redis, { RedisOptions } from 'ioredis'

import { config } from '@config'
import { AppLogger } from '@core'

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
    this.logger.setContext('Redis')
    this.redisInstance = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      retryStrategy: (times) => reconnectStrategy(times),
      keyPrefix: config.REDIS_KEY_PREFIX,
      ...options,
    })

    const combined = Object.create(this.redisInstance)
    Object.setPrototypeOf(combined, this.redisInstance)

    // Add custom methods here
    combined.set = this.set.bind(this)
    combined.get = this.get.bind(this)
    combined.del = this.del.bind(this)

    this.store = combined

    this.redisInstance.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error?.message}`, error?.stack)
    })

    this.redisInstance.on('connect', () => {
      this.logger.log(`Redis connected: ${this.options.db || 0}`)
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
