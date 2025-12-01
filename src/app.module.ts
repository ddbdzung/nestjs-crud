import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { HttpLoggerInterceptor, LoggerModule } from '@core'

import { AppController } from './app.controller'

@Module({
  imports: [LoggerModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
})
export class AppModule {}
