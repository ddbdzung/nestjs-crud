import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ForbiddenError } from '@/core/api'
import { getViewer } from '@/core/api/viewer.helper'

import { ERole } from '../authorization.constant'
import { ROLES_KEY } from './role.decorator'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(protected reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requireRoles?.length) {
      return true
    }

    const viewer = getViewer(context.switchToHttp().getRequest())
    if (!viewer) {
      throw new ForbiddenError('AUTHORIZATION.INSUFFICIENT_AUTHORITY')
    }

    const matchRoles = RoleGuard.matchRoles(requireRoles, viewer.role as ERole)
    if (!matchRoles) {
      throw new ForbiddenError('AUTHORIZATION.INSUFFICIENT_AUTHORITY')
    }
    return true
  }

  private static matchRoles(requireRoles: ERole[], userRole: ERole) {
    return requireRoles.some((role) => role === userRole)
  }
}
