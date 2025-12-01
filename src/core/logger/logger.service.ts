import { ClsService } from 'nestjs-cls'

import {
  Inject,
  Injectable,
  LoggerService,
  Optional,
  Scope,
} from '@nestjs/common'

import { setClsService, winstonLogger } from './logger.config'

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private readonly context: string
  private static isClsServiceSet = false

  /**
   * Constructor cho NestJS DI - nhận context trong constructor
   * @param cls - ClsService (optional, sẽ được inject tự động)
   * @param context - Context name (optional, nếu không có sẽ dùng 'AppLogger')
   */
  constructor(
    @Optional() @Inject(ClsService) private readonly cls?: ClsService,
    @Optional() @Inject('LOGGER_CONTEXT') context?: string
  ) {
    // Inject ClsService vào winston config (chỉ set một lần)
    if (this.cls && !AppLogger.isClsServiceSet) {
      setClsService(this.cls)
      AppLogger.isClsServiceSet = true
    }

    // Set context từ parameter hoặc default
    this.context = context || 'AppLogger'
  }

  /**
   * Static factory method để tạo logger với context tự động từ class name
   * Sử dụng khi tạo instance mới: AppLogger.create(cls, MyClass)
   */
  static create(
    cls: ClsService,
    context: string | (new (...args: any[]) => any)
  ): AppLogger {
    const contextName =
      typeof context === 'string' ? context : context.name || 'Unknown'
    return new AppLogger(cls, contextName)
  }

  /**
   * Log với context tự động
   */
  private logWithContext(
    level: 'info' | 'error' | 'warn' | 'debug' | 'verbose' | 'http',
    ...args: any[]
  ): void {
    const [firstArg, ...restArgs] = args

    // Xử lý error với metadata object
    if (
      level === 'error' &&
      restArgs.length > 0 &&
      typeof restArgs[0] === 'object' &&
      restArgs[0] !== null
    ) {
      const meta = restArgs[0] as Record<string, any>
      winstonLogger[level](firstArg, {
        context: this.context,
        ...meta,
      })
      return
    }

    // Xử lý HTTP với metadata
    if (
      level === 'http' &&
      restArgs.length > 0 &&
      typeof restArgs[0] === 'object' &&
      restArgs[0] !== null
    ) {
      const meta = restArgs[0] as Record<string, any>
      winstonLogger[level](firstArg, {
        context: this.context,
        ...meta,
      })
      return
    }

    // Xử lý các log level khác
    if (restArgs.length > 0) {
      // Nếu restArgs[0] là object, merge vào metadata
      if (
        typeof restArgs[0] === 'object' &&
        restArgs[0] !== null &&
        !Array.isArray(restArgs[0])
      ) {
        winstonLogger[level](firstArg, {
          context: this.context,
          ...restArgs[0],
        })
      } else {
        // Format như util.format với context trong metadata
        winstonLogger[level](firstArg, {
          context: this.context,
          [Symbol.for('splat')]: restArgs,
        })
      }
    } else {
      // Chỉ có message - vẫn truyền context qua metadata
      winstonLogger[level](firstArg, {
        context: this.context,
      })
    }
  }

  log(...args: any[]): void {
    this.logWithContext('info', ...args)
  }

  info(...args: any[]): void {
    this.logWithContext('info', ...args)
  }

  /**
   * Log error với format chuẩn
   * @param message - Error message
   * @param error - Error object hoặc stack trace string (optional)
   * @param meta - Additional metadata (optional)
   */
  error(
    message: any,
    error?: Error | string,
    meta?: Record<string, any>
  ): void {
    if (error) {
      const stack = error instanceof Error ? error.stack : error
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logWithContext('error', message, {
        error: errorMessage,
        stack,
        ...meta,
      })
    } else {
      this.logWithContext('error', message, meta)
    }
  }

  warn(...args: any[]): void {
    this.logWithContext('warn', ...args)
  }

  debug(...args: any[]): void {
    this.logWithContext('debug', ...args)
  }

  verbose(...args: any[]): void {
    this.logWithContext('verbose', ...args)
  }

  http(...args: any[]): void {
    this.logWithContext('http', ...args)
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
