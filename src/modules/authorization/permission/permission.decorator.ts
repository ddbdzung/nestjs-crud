import { SetMetadata } from '@nestjs/common'

import { EPermission } from '../authorization.constant'

/**
 * Assign access permissions according to the user's role at the controller
 * Applies to both classes and functions
 * Perms in function will override (ignore) Perms of class
 */
export const PERMISSIONS_KEY = 'permissions'
export const Permissions = (...permissions: EPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
