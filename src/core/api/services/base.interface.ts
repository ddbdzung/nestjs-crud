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
  extraData?: Record<string, any>
  user?: IAccountAuth
  skipCache?: boolean
  updateOne?: {
    includeOldRecord: true // Sử dụng flag này khi cần lấy bản ghi cũ xử lý trong hook postUpdateOne,...
  }
  postCreateOrUpdate?: {
    fullPopulation?: boolean // Lấy dữ liệu full-population bên cạnh task
  } // Option: sau tạo hoặc cập nhật bản ghi
  socketClientId?: string // Client ID socket của view người thực hiện nếu có
}
