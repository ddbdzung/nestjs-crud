import { ClsService } from 'nestjs-cls'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'

import {
  getViewerEmail,
  getViewerId,
  getViewerName,
  setViewerEmailToCls,
  setViewerIdToCls,
  setViewerNameToCls,
} from '../api/viewer.helper'
import { ETrace, pushTrace } from './request-context.middleware'

@Injectable()
export class ClsUserInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    if (this.cls.isActive()) {
      const viewerId = getViewerId(req)
      const viewerName = getViewerName(req)
      const viewerEmail = getViewerEmail(req)

      if (viewerId) {
        setViewerIdToCls(this.cls, viewerId)
      }
      if (viewerName) {
        setViewerNameToCls(this.cls, viewerName)
      }
      if (viewerEmail) {
        setViewerEmailToCls(this.cls, viewerEmail)
      }
      pushTrace(this.cls, ETrace.AFTER_GUARD)
    }
    return next.handle().pipe(
      tap(() => {
        // No-op, just forward
      })
    )
  }
}
