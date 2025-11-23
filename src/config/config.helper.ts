import { ConfigService } from './config.service'

export const generateMongoURI = (config: ConfigService): string => {
  const auth =
    config.MONGO_USERNAME && config.MONGO_PASSWORD
      ? `${config.MONGO_USERNAME}:${config.MONGO_PASSWORD}@`
      : ''
  const path = `${config.MONGO_HOST}:${config.MONGO_PORT}/${config.MONGO_DATABASE}`
  return 'mongodb://' + auth + path
}

export const generateRedisURI = (config: ConfigService): string => {
  const auth = config.REDIS_PASSWORD ? `:${config.REDIS_PASSWORD}@` : ''
  const path = `${config.REDIS_HOST}:${config.REDIS_PORT}`
  return 'redis://' + auth + path
}
