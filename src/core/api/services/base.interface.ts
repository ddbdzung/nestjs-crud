import { RedisService } from '@/core/db/redis/redis.service'

export interface IAccountAuth {
  viewer: {
    id: string
  }
}

export interface ICacheApi {
  urlSuffix: string
}

export interface IServiceOptions {
  alias?: string
  aliasUp?: string
  cacheApi?: ICacheApi
  redisService?: RedisService
}

export interface IExtraOptions {
  skipThrow?: boolean
  user?: IAccountAuth
  skipCache?: boolean
  socketClientId?: string // Client ID socket của view người thực hiện nếu có

  // Query options
  lean?: boolean // Trả về plain object thay vì Mongoose document (tăng performance)
  select?: string | Record<string, number> // Chọn fields cụ thể (e.g. 'name email' hoặc { name: 1, email: 1 })

  // Hook control
  skipHooks?: boolean // Bỏ qua pre/post hooks (dùng cho bulk operations, migrations)
}
