import { SetMetadata, applyDecorators } from '@nestjs/common'
import { ApiForbiddenResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator'

export const WHITELIST_EMAIL_ROLE_KEY = 'whitelist_email_role'
export const WhitelistEmailRole = (roles: string[], emails: string[]) => {
  return applyDecorators(
    SetMetadata(WHITELIST_EMAIL_ROLE_KEY, {
      roles: roles.flat(),
      emails: emails.flat(),
    }),
    ApiForbiddenResponse({
      description: `Access role: ${roles.flat().toString()}, email: ${emails.flat().toString()}`,
    })
  )
}
