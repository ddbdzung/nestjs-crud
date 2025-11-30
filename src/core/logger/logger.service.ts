import { ClsService } from 'nestjs-cls'

import { Injectable, LoggerService, Scope } from '@nestjs/common'

import { LogMetadata, setClsService, winstonLogger } from './logger.config'

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string
  private isClsServiceSet = false

  constructor(private readonly cls?: ClsService) {
    // Inject ClsService vào winston config
    if (cls && !this.isClsServiceSet) {
      setClsService(cls)
      this.isClsServiceSet = true
    }
  }

  /**
   * Set context name (thường là tên Class)
   */
  setContext(context: string): void {
    this.context = context
  }

  /**
   * Format message với context
   */
  private formatMessage(message: any, context?: string): string {
    const ctx = context || this.context
    return ctx ? `[${ctx}] ${message}` : message
  }

  /**
   * Log info level
   */
  log(message: any, context?: string): void {
    winstonLogger.info(this.formatMessage(message, context))
  }

  /**
   * Log error level
   */
  error(message: any, trace?: string, context?: string): void {
    if (trace) {
      winstonLogger.error(this.formatMessage(message, context), { stack: trace })
    } else {
      winstonLogger.error(this.formatMessage(message, context))
    }
  }

  /**
   * Log warning level
   */
  warn(message: any, context?: string): void {
    winstonLogger.warn(this.formatMessage(message, context))
  }

  /**
   * Log debug level
   */
  debug(message: any, context?: string): void {
    winstonLogger.debug(this.formatMessage(message, context))
  }

  /**
   * Log verbose level
   */
  verbose(message: any, context?: string): void {
    winstonLogger.verbose(this.formatMessage(message, context))
  }

  /**
   * Log HTTP requests (không format với context)
   */
  http(message: any, meta?: LogMetadata): void {
    winstonLogger.http(message, meta)
  }

  /**
   * Set userId vào CLS context (dùng sau khi authenticate)
   */
  setUserId(userId: string): void {
    if (this.cls) {
      this.cls.set('userId', userId)
    }
  }

  /**
   * Get requestId từ CLS context
   */
  getRequestId(): string | undefined {
    return this.cls?.getId()
  }

  /**
   * Set custom value vào CLS context
   */
  setContextValue(key: string, value: any): void {
    if (this.cls) {
      this.cls.set(key, value)
    }
  }

  /**
   * Get custom value từ CLS context
   */
  getContextValue<T = any>(key: string): T | undefined {
    return this.cls?.get<T>(key) as T | undefined
  }
}
