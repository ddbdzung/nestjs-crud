/* eslint-disable no-console */
import { FastifyCorsOptions } from '@fastify/cors'
import * as customEnv from 'custom-env'
import * as ip from 'ip'
import ms from 'ms'
import path from 'path'

import { Injectable } from '@nestjs/common'

import { CURRENT_ENV, ENVIRONMENT } from '@/core/constants/common.constant'

import { generateMongoURI, generateRedisURI } from './config.helper'

const customEnvName = process.env.DOT_ENV_SUFFIX || CURRENT_ENV

console.log('Using NODE_ENV: ' + process.env.NODE_ENV)
console.log('Using customEnvName: ' + customEnvName)
customEnv.env(customEnvName)

const env = Object.assign({}, process.env)

@Injectable()
export class ConfigService {
  // Common
  DEV = ENVIRONMENT.DEVELOPMENT
  PROD = ENVIRONMENT.PRODUCTION
  TEST = ENVIRONMENT.TEST
  STAGING = ENVIRONMENT.STAGING

  DEBUG_NAMESPACE = env.DEBUG_NAMESPACE
  isDev = () => CURRENT_ENV === this.DEV
  isProd = () => CURRENT_ENV === this.PROD
  isTest = () => CURRENT_ENV === this.TEST
  isStaging = () => CURRENT_ENV === this.STAGING

  NODE_ENV = env.NODE_ENV
  MODULE_ALIAS = env.MODULE_ALIAS || 'rental'
  PAGINATION_PAGE_SIZE = parseInt(env.PAGINATION_PAGE_SIZE ?? '100', 10)
  UPLOAD_MAX_SIZE = parseInt(env.UPLOAD_MAX_SIZE ?? '1024', 10) * 1024 * 5 // 5MB
  DOMAIN = this.isProd() ? '127.0.0.1' : '127.0.0.1'

  // DIR
  ROOT_PATH = path.resolve(__dirname, '..', '..')

  // NETWORK
  LOCAL_IP: string = ip.address()
  PUBLIC_IP: string = env.PUBLIC_IP || this.LOCAL_IP
  PORT = parseInt(env.PORT ?? '3000', 10)
  HOST = `http://${this.PUBLIC_IP}:${this.PORT}`
  TCP_PORT = parseInt(env.TCP_PORT ?? '3001', 10)

  // DB
  MONGO_HOST = env.MONGO_HOST ?? '127.0.0.1'
  MONGO_PORT = parseInt(env.MONGO_PORT ?? '27017', 10)
  MONGO_USERNAME = env.MONGO_USERNAME
  MONGO_PASSWORD = env.MONGO_PASSWORD
  MONGO_DATABASE = env.MONGO_DATABASE
  MONGO_URI: string = env.MONGO_URI ?? generateMongoURI(this)

  REDIS_HOST = env.REDIS_HOST ?? '127.0.0.1'
  REDIS_PORT = parseInt(env.REDIS_PORT ?? '6379', 10)
  REDIS_PASSWORD = env.REDIS_PASSWORD
  REDIS_URI = env.REDIS_URI ?? generateRedisURI(this)
  REDIS_KEY_PREFIX = [env.REDIS_KEY_PREFIX ?? 'RENTAL', this.NODE_ENV, ''].join(
    '_'
  )
  readonly REDIS_STORAGE = {
    COMMON: 0,
    DB: 1,
    SETTING: 2,
    API: 3,
    AUTH: 5,
    QUEUE: 6,
    SOCKET: 7,
  } as const

  CACHE_SHORT_TIMEOUT = ms('1m')
  CACHE_FIVE_MINUTES = ms('5m')
  CACHE_TIMEOUT = ms('1d')
  CACHE_LONG_TIMEOUT = ms('30d')

  readonly CORS: FastifyCorsOptions = {
    origin: '*',
    credentials: true,
    methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders:
      'content-type, authorization, accept-encoding, user-agent, accept, cache-control, connection, cookie, ref-token, x-socket-client-id',
    exposedHeaders:
      'X-RateLimit-Reset, Retry-After, set-cookie, Content-Disposition, X-File-Name',
  } as const

  // Swagger/API Documentation
  readonly SR = {
    PRODUCT_NAME: env.PRODUCT_NAME || 'NestJS CRUD API',
    VERSION: env.VERSION || '1.0.0',
    SIGNATURE: env.SIGNATURE || 'NestJS CRUD',
    SUPPORT: {
      URL: env.SUPPORT_URL || 'https://github.com',
      EMAIL: env.SUPPORT_EMAIL || 'support@example.com',
    },
  } as const

  SWAGGER_CREDENTIAL_NAME = env.SWAGGER_CREDENTIAL_NAME
  SWAGGER_CREDENTIAL_PASS = env.SWAGGER_CREDENTIAL_PASS

  readonly RATE_LIMIT = {
    global: true, // Apply rate limiting to all routes by default
    windowMs: 60 * 1000, // Deprecated for fastify, keeping for backward compatibility
    timeWindow: parseInt(env.RATE_LIMIT_WINDOW ?? '60', 10) * 1000 || 60 * 1000, // @fastify/rate-limit uses timeWindow (in milliseconds)
    max: parseInt(env.RATE_LIMIT_MAX ?? '100', 10),
    nameSpace: env.REDIS_RATE_LIMIT_NAMESPACE ?? ':rate-limit:',
    redis: null, // Will be initialized in main.ts with actual Redis client
    skipOnError: true, // Skip rate limiting if Redis is down to prevent API failures
    continueExceeding: false, // Don't renew limitation when user exceeds
    // onExceeding: function(req, key) {
    //   console.log(`[RATE LIMIT] Request from ${key} is approaching limit`);
    // },
    // onExceeded: function(req, key) {
    //   console.log(`[RATE LIMIT] Request from ${key} has exceeded the limit`);
    // },
    keyGenerator: function (req: any) {
      return req.headers['authorization']?.split(' ')[1] || req.ip
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    allowList: (req: any, _key: any) => {
      const url = (req.url ?? '') as string

      const staticPrefixes = [
        `/api/${this.MODULE_ALIAS}`,
        `/api/admin/${this.MODULE_ALIAS}`,
      ]

      return staticPrefixes.some((p) => url.startsWith(p))
    },
  } as const
}

export const config = new ConfigService()
