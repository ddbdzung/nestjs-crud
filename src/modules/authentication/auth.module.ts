import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'

import { AccountModule } from '../account/account.module'
import { JwtAdminGuard } from './jwt-admin/jwt-admin.guard'
import { JwtAdminStrategy } from './jwt-admin/jwt-admin.strategy'
import { JwtGuard } from './jwt/jwt.guard'
import { JwtStrategy } from './jwt/jwt.strategy'

@Module({
  imports: [AccountModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtAdminGuard, JwtAdminStrategy, JwtGuard, JwtStrategy],
})
export class AuthModule {}
