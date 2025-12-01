import 'module-alias/register'

import { ClsService } from 'nestjs-cls'

import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { config } from '@config'
import { API_PREFIX, AppLogger, ENABLE_TRACE_INFO } from '@core'

import { AppModule } from './app.module'
import { createRedisRateLimit } from './core/db/redis/redis-ratelimit'
import { ClsUserInterceptor } from './core/middlewares/cls-user.interceptor'
import { HttpExceptionFilter } from './core/middlewares/http-exception.filter'
import {
  FASTIFY_MORGAN_LOGGER,
  useMorgan,
} from './core/middlewares/morgan.middleware'
import {
  ETrace,
  getReqCtxPretty,
  pushTrace,
  RequestContextMiddleware,
} from './core/middlewares/request-context.middleware'
import { ResponseTransformInterceptor } from './core/middlewares/response-transform.interceptor'
import { UnknownExceptionsFilter } from './core/middlewares/unknown-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(FASTIFY_MORGAN_LOGGER)
  )
  const cls = app.get(ClsService)
  const logger = AppLogger.create(cls, 'Bootstrap')
  const rateLimitConfig = {
    ...config.RATE_LIMIT,
    redis: await createRedisRateLimit(cls),
  }
  logger.info('Rate limit configuration:', {
    max: rateLimitConfig.max,
    timeWindow: rateLimitConfig.timeWindow,
    global: rateLimitConfig.global,
    nameSpace: rateLimitConfig.nameSpace,
    skipOnError: rateLimitConfig.skipOnError,
    continueExceeding: rateLimitConfig.continueExceeding,
  })

  app.enableCors(config.CORS)
  app.setGlobalPrefix(API_PREFIX)
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (req, res, done: () => void) => {
      new RequestContextMiddleware(app.get(ClsService)).use(req, res, done)
    })
  app.use(useMorgan(logger))
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onResponse', (req: any, _res: any, done: () => void) => {
      const cls = app.get(ClsService)
      if (cls.isActive()) {
        pushTrace(cls, ETrace.ON_RESPONSE)

        const end = Date.now()
        const start = cls.get('requestStartTime')
        if (start) {
          cls.set('requestDuration', end - start)
        }

        if (ENABLE_TRACE_INFO) {
          logger.http(`← ${ETrace.ON_RESPONSE}`, getReqCtxPretty(cls))
        }
      }

      done()
    })

  const clsService = app.get(ClsService)
  app.useGlobalInterceptors(
    new ClsUserInterceptor(clsService),
    new ResponseTransformInterceptor()
  )
  app.useGlobalFilters(new UnknownExceptionsFilter(clsService))
  app.useGlobalFilters(new HttpExceptionFilter(clsService))

  await app.listen(process.env.PORT ?? 3000, () => {
    logger.info(`Server is running on port ${process.env.PORT ?? 3000}`)
  })
}
bootstrap()
