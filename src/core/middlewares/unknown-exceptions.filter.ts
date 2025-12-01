import { ClsService } from 'nestjs-cls'

import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'

import * as exc from '../api/exception.resolver'
import { MONGOOSE_ERROR_CODES } from '../constants/error-code.constant'
import { HttpExceptionFilter } from './http-exception.filter'

/**
 * Type guards cho các exception types
 */
interface MongooseError extends Error {
  name: string
  code?: number
  message: string
}

interface RateLimitError extends Error {
  statusCode: number
  message: string
}

function isMongooseError(exception: any): exception is MongooseError {
  return (
    exception &&
    typeof exception === 'object' &&
    typeof exception.name === 'string' &&
    MONGOOSE_ERROR_CODES.includes(exception.name)
  )
}

function isRateLimitError(exception: any): exception is RateLimitError {
  return (
    exception &&
    typeof exception === 'object' &&
    exception.statusCode === 429 &&
    typeof exception.message === 'string'
  )
}

function isStreamError(exception: any): boolean {
  return (
    exception &&
    typeof exception === 'object' &&
    typeof exception.code === 'string' &&
    ['ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_DESTROYED'].includes(
      exception.code
    )
  )
}

@Catch()
export class UnknownExceptionsFilter extends HttpExceptionFilter {
  constructor(cls?: ClsService) {
    super(cls)
    // Context tự động được set từ class name trong parent constructor
  }

  override async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<any>()

    // Xử lý Mongoose errors với type guard
    if (isMongooseError(exception)) {
      if (exception.code === 11000) {
        const duplicateError = new exc.DuplicateError()
        const errorJson = duplicateError.toJSON()
        const httpException = new HttpException(
          errorJson,
          duplicateError.getStatusCode
        )
        return super.catch(httpException, host) as any
      }

      this.logger.debug(`Mongoose error: ${JSON.stringify(exception)}`)
      const queryDbError = new exc.SystemError(exception.message)
      const errorJson = queryDbError.toJSON()
      const httpException = new HttpException(
        errorJson,
        queryDbError.getStatusCode
      )
      return super.catch(httpException, host) as any
    }

    // Xử lý rate limit errors với type guard
    if (isRateLimitError(exception)) {
      const tooManyRequestsError = new exc.TooManyRequestsError(
        exception.message
      )
      const errorJson = tooManyRequestsError.toJSON()
      const httpException = new HttpException(
        errorJson,
        tooManyRequestsError.getStatusCode
      )
      return super.catch(httpException, host) as any
    }

    // Log unknown exception với thông tin request
    const requestInfo = JSON.stringify({
      method: request?.method,
      url: request?.url,
      ip: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    })
    this.logger.warn(`Unknown exception occurred: ${requestInfo}`)

    // Log chi tiết hơn nếu là lỗi stream / nội bộ Node với type guard
    if (isStreamError(exception)) {
      const streamErrorInfo = JSON.stringify({
        code: exception.code,
        method: request?.method,
        url: request?.url,
        ip: request?.ip,
      })
      this.logger.warn(`Stream/internal error detected: ${streamErrorInfo}`)
    }

    this.logger.error(
      exception.message || String(exception),
      exception instanceof Error ? exception : new Error(String(exception))
    )

    const e = new exc.SystemError()
    const errorJson = e.toJSON()
    const httpException = new HttpException(errorJson, e.getStatusCode)
    return super.catch(httpException, host) as any
  }
}
