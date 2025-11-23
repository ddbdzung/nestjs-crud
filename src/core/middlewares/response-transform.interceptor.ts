import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'

import { HTTP_STATUS } from '../constants/http-status.constant'
import { BaseError } from '../helpers/error.helper'
import { HttpResponse } from '../helpers/http-response.helper'

/**
 * Type for HttpResponse JSON output
 */
type HttpResponseJson = ReturnType<typeof HttpResponse.prototype.toJSON>

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  HttpResponseJson
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<HttpResponseJson> {
    return next.handle().pipe(
      map((data) => {
        // Nếu đã là HttpResponse, giữ nguyên
        if (data instanceof HttpResponse) {
          return data.toJSON()
        }

        // Nếu là BaseError, merge về HttpResponse format
        if (data instanceof BaseError) {
          const errorJson = data.toJSON()
          return new HttpResponse(
            errorJson.statusCode,
            null, // error không có data
            errorJson.message,
            {
              errorCode: errorJson.errorCode,
              name: errorJson.name,
              isOperational: errorJson.isOperational,
              context: errorJson.context,
              ...errorJson.metadata,
            }
          ).toJSON()
        }

        return new HttpResponse(
          HTTP_STATUS.OK.code,
          data ?? null,
          HTTP_STATUS.OK.message
        ).toJSON()
      })
    )
  }
}
