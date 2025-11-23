import type { RedisService } from '@/core/db/redis/redis.service'

import type {
  EPermission,
  ERole,
} from '@/modules/authorization/authorization.constant'

export interface IAccountAuth {
  id: string
  email: string
  name: string
  role: ERole
  permissions: EPermission[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface IServiceOptions {
  alias?: string
  redisService?: RedisService
  aliasUp?: string // Alias uppercase
}

export interface IExtraOptions {
  skipThrow?: boolean
  viewer?: IAccountAuth
  socketClientId?: string // Client ID socket của view người thực hiện nếu có

  // Query options
  lean?: boolean // Trả về plain object thay vì Mongoose document (tăng performance)
  select?: string | Record<string, number> // Chọn fields cụ thể (e.g. 'name email' hoặc { name: 1, email: 1 })

  // Hook control
  skipHooks?: boolean // Bỏ qua pre/post hooks (dùng cho bulk operations, migrations)
}
