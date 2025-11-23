import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { UserAclController } from './controllers/useracl.controller'
import { UserAcl, UserAclSchema } from './schemas/useracl.schema'
import { UserAclService } from './services/useracl.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserAcl.name, schema: UserAclSchema }]),
  ],
  providers: [UserAclService],
  controllers: [UserAclController],
})
export class SettingCoreModule {}
