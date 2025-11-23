import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { HttpLoggerInterceptor } from './core/logger/http-logger.interceptor'
import { LoggerModule } from './core/logger/logger.module'

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
})
export class AppModule {}
