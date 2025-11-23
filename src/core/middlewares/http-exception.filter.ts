import { FastifyReply } from 'fastify'
import { ClsService } from 'nestjs-cls'

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common'

import { AppLogger } from '@/core/logger'

import * as exc from '../api/exception.resolver'
import { BaseError } from '../helpers/error.helper'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  protected readonly logger: AppLogger

  constructor(cls?: ClsService) {
    // Tạo logger mới với context từ class name
    if (cls) {
      this.logger = AppLogger.create(cls, HttpExceptionFilter.name)
    } else {
      this.logger = new AppLogger(undefined, HttpExceptionFilter.name)
    }
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const hostType = host.getType()
    if (!['http'].includes(hostType)) return

    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    let excResponse = exception.getResponse()
    const excStatus = exception.getStatus()

    // Nếu response không phải object hợp lệ (string, number, array, null), chuyển đổi thành BaseError format
    if (
      typeof excResponse !== 'object' ||
      excResponse === null ||
      Array.isArray(excResponse)
    ) {
      const message =
        typeof excResponse === 'string'
          ? excResponse
          : Array.isArray(excResponse)
            ? JSON.stringify(excResponse)
            : String(excResponse)
      excResponse = new BaseError(message, {
        statusCode: excStatus,
        errorCode: exc.UNKNOWN,
        context: { originalResponse: excResponse },
      }).toJSON()
    }

    // HTTP
    if (hostType === 'http') {
      response.status(excStatus).send(excResponse)
      this.logger.debug(excStatus, JSON.stringify(excResponse))
    }

    return excResponse
  }
}
