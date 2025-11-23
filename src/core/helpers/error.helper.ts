import { IThrowable } from '../common.interface'
import { CURRENT_ENV } from '../constants/common.constant'
import { HTTP_STATUS } from '../constants/http-status.constant'

export interface IBaseErrorOptions {
  /**
   * - HTTP status code (e.g., 400, 401, 403, 404, 500). Default: 500 (INTERNAL_SERVER_ERROR)
   */
  statusCode?: number
  /**
   * - Error code string (e.g., 'VALIDATION_ERROR'). Default: HTTP status code
   */
  errorCode?: string
  /**
   * - true: Operational error (expected), false: Programming error (bug)
   */
  isOperational?: boolean
  /**
   * - Additional context data for debugging (e.g., { userId: 123, action: 'login' })
   */
  context?: Record<string, any>
  /**
   * - Additional metadata to merge with defaults (timestamp, environment)
   */
  metadata?: Record<string, any>
  /**
   * - The original error that caused this error (for error chaining)
   */
  cause?: Error
}

export interface ISerializedError {
  name: string
  message: string
  statusCode: number
  errorCode: string
  isOperational: boolean
  context: Record<string, any>
  metadata: Record<string, any>
  stack?: string
  cause?: ISerializedError | { message: string; stack?: string }
}

export class BaseError extends Error implements IThrowable {
  protected statusCode: number
  protected errorCode: string
  protected isOperational: boolean
  protected context: Record<string, any> = {}
  protected metadata: Record<string, any> = {}
  override cause?: Error

  /**
   * @param message - Error message
   * @param {IBaseErrorOptions} [options] - Error options
   */
  constructor(message: string, options: IBaseErrorOptions = {}) {
    super(message)

    // Error identity
    this.name = this.constructor.name
    this.message = message.trim()

    // HTTP context
    this.statusCode =
      options.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR.code
    this.errorCode = options.errorCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR.key

    // Error classification
    this.isOperational = options.isOperational ?? true

    // Additional context
    this.context = options.context ?? {} // Specifically for debugging

    // Additional metadata
    this.metadata = {
      timestamp: new Date(),
      environment: CURRENT_ENV,
      ...(options.metadata ?? {}),
    } // Merge with defaults (timestamp, environment)

    // Error chaining support
    if (options.cause) {
      this.cause = options.cause
    }

    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Getter để truy cập statusCode từ bên ngoài class
   * @returns HTTP status code
   */
  get getStatusCode(): number {
    return this.statusCode
  }

  toJSON(): ISerializedError {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      isOperational: this.isOperational,
      context: this.context,
      metadata: this.metadata,
      stack: this.stack,
      ...(this.cause && {
        cause:
          this.cause instanceof BaseError
            ? this.cause.toJSON()
            : {
                message: this.cause.message,
                stack: this.cause.stack,
              },
      }),
    }
  }
}
