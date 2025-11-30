import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'

import * as exc from '../api/exception.resolver'
import { MONGOOSE_ERROR_CODES } from '../constants/error-code.constant'
import { AppLogger } from '../logger/logger.service'
import { HttpExceptionFilter } from './http-exception.filter'

@Catch()
export class UnknownExceptionsFilter extends HttpExceptionFilter {
  constructor(logger: AppLogger) {
    super(logger)
    this.logger.setContext('UnknownExceptionsFilter')
  }

  override async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<any>()

    const mongosubStatus: string = exception.name

    if (MONGOOSE_ERROR_CODES.includes(mongosubStatus)) {
      if (exception.code === 11000) {
        const duplicateError = new exc.DuplicateError()
        const httpException = new HttpException(
          duplicateError.toJSON(),
          duplicateError['statusCode']
        )
        return super.catch(httpException, host) as any
      }

      this.logger.debug(`Mongoose error: ${JSON.stringify(exception)}`)
      const queryDbError = new exc.SystemError(exception.message)
      const httpException = new HttpException(queryDbError.toJSON(), queryDbError['statusCode'])
      return super.catch(httpException, host) as any
    }

    if (exception.statusCode === 429) {
      const tooManyRequestsError = new exc.TooManyRequestsError(exception.message)
      const httpException = new HttpException(
        tooManyRequestsError.toJSON(),
        tooManyRequestsError['statusCode']
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

    // Log chi tiết hơn nếu là lỗi stream / nội bộ Node
    if (['ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_DESTROYED'].includes(exception?.code)) {
      const streamErrorInfo = JSON.stringify({
        code: exception.code,
        method: request?.method,
        url: request?.url,
        ip: request?.ip,
      })
      this.logger.warn(`Stream/internal error detected: ${streamErrorInfo}`)
    }

    this.logger.error(exception.message || String(exception), exception.stack)

    const e = new exc.SystemError()
    const httpException = new HttpException(e.toJSON(), e['statusCode'])
    return super.catch(httpException, host) as any
  }
}
