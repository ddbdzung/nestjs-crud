import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { AppController } from './app.controller'
import { RedisModule } from './core/db/redis/redis.module'
import { HttpLoggerInterceptor } from './core/logger/http-logger.interceptor'
import { LoggerModule } from './core/logger/logger.module'

@Module({
  imports: [LoggerModule, RedisModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
})
export class AppModule {}
