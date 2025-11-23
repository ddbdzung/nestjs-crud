import { FastifyRequest } from 'fastify'
import { ExtractJwt } from 'passport-jwt'
import { Strategy } from 'passport-local'

import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'

import { ForbiddenError, UnauthorizedError } from '@/core/api'
import { BaseError } from '@/core/helpers/error.helper'
import { AppLogger } from '@/core/logger'

// import { AccountService } from '../account/account.service'

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(
  Strategy,
  'admin_guard'
) {
  private logger: AppLogger = new AppLogger(undefined, JwtAdminStrategy.name)

  constructor() {
    // private readonly accountService: AccountService,
    super({
      usernameField: 'Bearer',
      passwordField: 'Bearer',
      passReqToCallback: true,
    })
  }

  override authenticate(req: any, options: Record<string, any>) {
    const userToken = ExtractJwt.fromAuthHeaderAsBearerToken()(
      req as FastifyRequest
    )
    const request = Object.assign({}, req, { body: { Bearer: userToken } })
    return super.authenticate(request, options)
  }

  async validate(_req: FastifyRequest, userToken: string) {
    try {
      if (!userToken) {
        throw new UnauthorizedError('AUTHENTICATION.UNAUTHORIZED')
      }

      // TODO: Implement auth
      // return this.accountService.me(userToken)
    } catch (error) {
      if (error instanceof BaseError) throw error

      this.logger.error(error)
      throw new ForbiddenError('AUTHENTICATION.AUTH_ERROR')
    }
  }
}
