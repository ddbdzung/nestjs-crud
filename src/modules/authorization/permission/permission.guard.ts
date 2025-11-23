import { FastifyRequest } from 'fastify'

// import { RedisClient } from '@/core/db/redis/redis.helper'
// import { RedisService } from '@/core/db/redis/redis.service'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ForbiddenError, IAccountAuth } from '@/core/api'
import { getViewer } from '@/core/api/viewer.helper'
import { AppLogger } from '@/core/logger'

import { ERole } from '../authorization.constant'
import { PERMISSIONS_KEY } from './permission.decorator'

@Injectable()
export class PermissionGuard implements CanActivate {
  // private cache: RedisClient

  constructor(
    protected reflector: Reflector,
    private readonly logger: AppLogger
    // private readonly redisService: RedisService
  ) {
    // this.cache = this.redisService.auth
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirePerms = this.reflector.getAllAndOverride<string>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requirePerms?.length) {
      return true
    }
    const req = context.switchToHttp().getRequest<FastifyRequest>()
    const viewer = getViewer(req) as IAccountAuth
    if (!viewer.isActive) {
      throw new ForbiddenError('AUTHORIZATION.ACCOUNT_NOT_ACTIVE')
    }

    if (ERole.ADMIN === viewer.role) {
      return true
    }

    const viewerPerms = new Set<string>(viewer.permissions)
    for (const perm of requirePerms) {
      if (!viewerPerms.has(perm)) {
        this.logger.debug(
          `Permission ${perm} not found for viewer ${viewer.id}`
        )
        throw new ForbiddenError('AUTHORIZATION.INSUFFICIENT_AUTHORITY')
      }
    }

    return true
  }
}
