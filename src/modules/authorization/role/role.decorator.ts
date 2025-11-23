import { SetMetadata, applyDecorators } from '@nestjs/common'
import { ApiForbiddenResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator'

import { ERole } from '../authorization.constant'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: ERole[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiForbiddenResponse({
      description:
        'Access role: ' + (roles.length ? roles.toString() : 'Block all'),
    })
  )
}
