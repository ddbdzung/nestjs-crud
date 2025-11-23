import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'

import { AppLogger } from '@/core/logger'

@Controller()
export class AppController {
  constructor(private readonly logger: AppLogger) {}

  @Get('ping')
  @ApiOperation({ summary: 'Ping' })
  ping(): string {
    this.logger.info('Ping request received')
    return 'pong'
  }
}
