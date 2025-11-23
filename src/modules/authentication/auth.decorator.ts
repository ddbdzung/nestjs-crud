import { ExecutionContext, createParamDecorator } from '@nestjs/common'

import { getViewer } from '@/core/api/viewer.helper'

export const ViewerAuth = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return getViewer(request)
})

export const ViewerAdminAuth = ViewerAuth
