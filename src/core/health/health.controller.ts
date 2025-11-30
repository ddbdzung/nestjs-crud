import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { HealthCheck } from '@nestjs/terminus'

import { AppLogger } from '@core'

@Controller('health')
export class HealthController {
  constructor(protected readonly logger: AppLogger) {
    this.logger.setContext(HealthController.name)
  }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @HealthCheck()
  async checkHealth() {
    return { status: true }
  }
}
