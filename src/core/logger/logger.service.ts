import { ClsService } from 'nestjs-cls'

import {
  Inject,
  Injectable,
  LoggerService,
  Optional,
  Scope,
} from '@nestjs/common'

import {
  COLOR,
  colorizeText,
  setClsService,
  winstonLogger,
} from './logger.config'

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
    const allArgs = [...args, `(${colorizeText(this.context, COLOR.GRAY)})`]
    ;(winstonLogger[level] as (...args: any[]) => void)(...allArgs)
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
  error(...args: any[]): void {
    this.logWithContext('warn', ...args)
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
