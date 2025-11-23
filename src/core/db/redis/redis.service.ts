import { config } from '@config'
import { ClsService } from 'nestjs-cls'

import { Injectable } from '@nestjs/common'

import { AppLogger } from '@/core/logger'

import { RedisClient, RedisClientExtend } from './redis.helper'

@Injectable()
export class RedisService {
  public common: RedisClient
  public auth: RedisClient
  public setting: RedisClient
  public api: RedisClient
  public db: RedisClient
  public queue: RedisClient
  public socket: RedisClient

  constructor(private readonly cls: ClsService) {
    // Tạo logger riêng cho mỗi Redis client với context riêng
    const createRedisClient = (
      alias: string,
      database: number
    ): RedisClient => {
      const clientLogger = AppLogger.create(this.cls, alias)
      return new RedisClientExtend(clientLogger, { db: database }).store
    }

    this.common = createRedisClient('common-redis', config.REDIS_STORAGE.COMMON)
    this.auth = createRedisClient('auth-redis', config.REDIS_STORAGE.AUTH)
    this.setting = createRedisClient(
      'setting-redis',
      config.REDIS_STORAGE.SETTING
    )
    this.api = createRedisClient('api-redis', config.REDIS_STORAGE.API)
    this.db = createRedisClient('db-redis', config.REDIS_STORAGE.DB)
    this.queue = createRedisClient('queue-redis', config.REDIS_STORAGE.QUEUE)
    this.socket = createRedisClient('socket-redis', config.REDIS_STORAGE.SOCKET)
  }
}
