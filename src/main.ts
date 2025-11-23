import { config } from '@config'
import fastifyCompress from '@fastify/compress'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { useContainer } from 'class-validator'
import 'module-alias/register'
import { ClsService } from 'nestjs-cls'

import { NestFactory } from '@nestjs/core'
import { TcpOptions, Transport } from '@nestjs/microservices'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppLogger } from '@/core/logger'

import { AppModule } from './app.module'
import { voidCatcher, voidCatcherLogger } from './core/api'
import { API_PREFIX, ENABLE_TRACE_INFO } from './core/constants/common.constant'
import { createRedisRateLimit } from './core/db/redis/redis-ratelimit'
import winstonLogger, {
  inspectMessageMongoDb,
} from './core/logger/logger.config'
import { ClsUserInterceptor } from './core/middlewares/cls-user.interceptor'
import {
  ClassValidationPipe,
  exceptionFactory,
} from './core/middlewares/custom-validation.pipe'
import { HttpExceptionFilter } from './core/middlewares/http-exception.filter'
import {
  FASTIFY_MORGAN_LOGGER,
  useMorgan,
} from './core/middlewares/morgan.middleware'
import {
  ETrace,
  RequestContextMiddleware,
  getReqCtxPretty,
  pushTrace,
} from './core/middlewares/request-context.middleware'
import { ResponseTransformInterceptor } from './core/middlewares/response-transform.interceptor'
import { UnknownExceptionsFilter } from './core/middlewares/unknown-exceptions.filter'
import { initSwagger } from './core/swagger'

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
    .addHook('onResponse', (_req: any, _res: any, done: () => void) => {
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
  app.useGlobalPipes(
    new ClassValidationPipe({
      exceptionFactory,
      whitelist: true,
      stopAtFirstError: true,
    })
  )

  useContainer(app.select(AppModule), { fallbackOnErrors: true })
  initSwagger(app)
  inspectMessageMongoDb(winstonLogger)

  await app.register(fastifyRateLimit, rateLimitConfig)
  await app.register(fastifyCompress, { encodings: ['gzip', 'deflate'] })
  if (config.NODE_ENV === config.PROD) {
    await app.register(fastifyHelmet)
  }

  app.connectMicroservice(
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: config.TCP_PORT,
      },
    } as TcpOptions,
    { inheritAppConfig: true }
  )

  void app.startAllMicroservices().catch(voidCatcherLogger(logger))
  await app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${config.PORT}`)
  })

  logger.info(`Server time: ${new Date().toString()}`)
  logger.info(`Local - public: ${config.LOCAL_IP} - ${config.PUBLIC_IP}`)
  logger.info(`HTTP, TCP port: ${config.PORT} - ${config.TCP_PORT}`)
  logger.info(`Running app on: ${config.HOST}`)
  logger.info(`Api Document V1: ${config.HOST}/apidoc`)
  logger.info(`Api Gateway V1: ${config.HOST}/api`)
}

void bootstrap().catch(voidCatcher)
