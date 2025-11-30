import { FastifyReply } from 'fastify'

import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'

import * as exc from '../api/exception.resolver'
import { BaseError } from '../helpers/error.helper'
import { AppLogger } from '../logger/logger.service'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(protected readonly logger: AppLogger) {
    this.logger.setContext('HttpExceptionFilter')
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const hostType = host.getType()
    if (!['http'].includes(hostType)) return

    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    let excResponse = exception.getResponse()
    const excStatus = exception.getStatus()

    if (
      typeof excResponse !== 'object' ||
      !Object.getOwnPropertyDescriptor(excResponse, 'success')
    ) {
      let newDataResponse: Record<string, any> =
        typeof excResponse === 'object' ? excResponse : { message: excResponse }
      newDataResponse = newDataResponse?.message
      excResponse = new BaseError(newDataResponse?.message, {
        statusCode: excStatus,
        errorCode: exc.UNKNOWN,
        context: newDataResponse,
      }).toJSON()
    }

    // HTTP
    if (hostType === 'http') {
      void response.status(200).send(excResponse)
      this.logger.debug(excStatus, JSON.stringify(excResponse))
    }
  }
}
