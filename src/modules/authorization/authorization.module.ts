import { Global, Module } from '@nestjs/common'

import { PermissionGuard } from './permission/permission.guard'
import { RoleGuard } from './role/role.guard'
import { WhitelistEmailRoleGuard } from './whitelist/whitelist-email-role.guard'

/**
 * AuthorizationModule centralizes authorization-related guards and services.
 * Marked as Global so it only needs to be imported once (e.g. in AppModule).
 */
@Global()
@Module({
  imports: [],
  providers: [PermissionGuard, RoleGuard, WhitelistEmailRoleGuard],
  exports: [PermissionGuard, RoleGuard, WhitelistEmailRoleGuard],
})
export class AuthorizationModule {}
