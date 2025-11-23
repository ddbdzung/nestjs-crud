import { ClsModule, ClsService } from 'nestjs-cls'

import { Global, Module } from '@nestjs/common'

import { AppLogger } from '@/core/logger'

import { generateTraceId } from '../common.util'
import { REQUEST_ID_KEY } from '../constants/common.constant'

/*
# Winston log level
| Level     | Priority | Meaning                                                                                                 |  Support |
| --------- | -------- | ------------------------------------------------------------------------------------------------------- | -------- |
| `error`   | 0        | Something failed — code couldn’t continue normally. You usually alert on this.                          |    ✅    |
| `warn`    | 1        | Something unexpected happened, but the app can continue. E.g., deprecated API, missing optional config. |    ✅    |
| `info`    | 2        | General operational messages — app started, user logged in, task completed, etc.                        |    ✅    |
| `http`    | 3        | (optional, user-defined) HTTP-specific events — request logs, status codes, latency.                    |    ✅    |
| `verbose` | 4        | Detailed info for tracing complex flows — e.g., database query results.                                 |    ✅    |
| `debug`   | 5        | Debugging messages, usually turned on only in development.                                              |    ✅    |
| `silly`   | 6        | Extremely fine-grained, often noisy — like internal state dumps.                                        |    ❌    |
*/

/**
 * Factory function để tạo AppLogger với context tự động từ class name
 * Sử dụng trong providers với useFactory
 */
export function createLoggerFactory(cls: ClsService, context?: string) {
  if (context) {
    return AppLogger.create(cls, context)
  }
  const logger = new AppLogger(cls)
  return logger
}

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
  providers: [
    AppLogger,
    {
      provide: 'LOGGER_FACTORY',
      useFactory: (cls: ClsService) => (context?: string) => {
        if (context) {
          return AppLogger.create(cls, context)
        }
        return new AppLogger(cls)
      },
      inject: [ClsService],
    },
  ],
  exports: [AppLogger, 'LOGGER_FACTORY'],
})
export class LoggerModule {}
