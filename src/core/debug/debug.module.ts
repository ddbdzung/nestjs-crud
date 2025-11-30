import { Module } from '@nestjs/common'

import { DebuggingController } from './debug.controller'

@Module({
  controllers: [DebuggingController],
})
export class DebuggingModule {}
