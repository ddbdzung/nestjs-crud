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
} from '../api/get-viewer.helper'
import { ETrace, pushTrace } from './request-context.middleware'

@Injectable()
export class ClsUserInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    if (req.user && this.cls.isActive()) {
      const viewerId = getViewerId(req)
      const viewerName = getViewerName(req)
      const viewerEmail = getViewerEmail(req)

      if (viewerId) {
        this.cls.set('viewerId', viewerId)
      }
      if (viewerName) {
        this.cls.set('viewerName', viewerName)
      }
      if (viewerEmail) {
        this.cls.set('viewerEmail', viewerEmail)
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
