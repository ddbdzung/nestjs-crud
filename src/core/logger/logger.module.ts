import { ClsModule } from 'nestjs-cls'

import { Global, Module } from '@nestjs/common'

import { generateTraceId } from '@/core/common.util'
import { REQUEST_ID_KEY } from '@/core/constants/common.constant'

import { AppLogger } from './logger.service'

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: any) => {
          if (req?.headers?.[REQUEST_ID_KEY]) {
            return req.headers[REQUEST_ID_KEY] as string
          }

          return generateTraceId()
        },
      },
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
