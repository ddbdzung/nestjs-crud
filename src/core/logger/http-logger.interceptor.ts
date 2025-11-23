import { ClsService } from 'nestjs-cls'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'

import { AppLogger } from '@/core/logger'

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger: AppLogger
  private readonly cls: ClsService

  constructor(cls: ClsService) {
    // Tự động set context từ class name
    this.cls = cls
    this.logger = AppLogger.create(cls, HttpLoggerInterceptor.name)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const ctx = context.switchToHttp()
    const request = ctx.getRequest()
    const { method, url, ip, headers } = request

    const userAgent = headers['user-agent'] || 'unknown'
    const startTime = Date.now()

    // Log incoming request
    this.logger.http(`→ ${method} ${url}`, {
      ip,
      userAgent,
      requestId: this.cls.getId(),
    })

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = ctx.getResponse()
          const { statusCode } = response
          const duration = Date.now() - startTime

          this.logger.http(`← ${method} ${url} ${statusCode} ${duration}ms`, {
            statusCode,
            duration,
            requestId: this.cls.getId(),
          })
        },
        error: (error) => {
          const duration = Date.now() - startTime
          const statusCode = error?.status || 500

          this.logger.error(
            `← ${method} ${url} ${statusCode} ${duration}ms - ${error.message}`,
            error instanceof Error ? error : new Error(String(error))
          )
        },
      })
    )
  }
}
