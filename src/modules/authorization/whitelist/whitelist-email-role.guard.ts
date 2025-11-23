import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ForbiddenError } from '@/core/api'
import { getViewer } from '@/core/api/viewer.helper'

import { ERole } from '../authorization.constant'
import { WHITELIST_EMAIL_ROLE_KEY } from './whitelist.decorator'

@Injectable()
export class WhitelistEmailRoleGuard implements CanActivate {
  constructor(protected reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireWhitelist = this.reflector.getAllAndOverride<{
      roles: ERole[]
      emails: string[]
    }>(WHITELIST_EMAIL_ROLE_KEY, [context.getHandler(), context.getClass()])

    const { roles: requireRoles, emails: requireEmails } = requireWhitelist

    const req = context.switchToHttp().getRequest()
    const viewer = getViewer(req)
    if (!viewer) {
      throw new ForbiddenError('AUTHORIZATION.INSUFFICIENT_AUTHORITY')
    }

    const matchRoles = WhitelistEmailRoleGuard.matchRoles(
      requireRoles,
      viewer.role
    )
    const matchEmails = WhitelistEmailRoleGuard.matchEmails(
      requireEmails,
      viewer.email
    )

    if ([matchRoles, matchEmails].some((cond) => cond === true)) {
      return true
    }

    throw new ForbiddenError('AUTHORIZATION.INSUFFICIENT_AUTHORITY')
  }

  private static matchRoles(requireRoles: ERole[], userRole: ERole) {
    return requireRoles.some((role) => role === userRole)
  }

  private static matchEmails(requireEmails: string[], userEmail: string) {
    return requireEmails.some((email) => email === userEmail)
  }
}
