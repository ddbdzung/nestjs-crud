import { ClsService } from 'nestjs-cls'

import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { HealthCheck } from '@nestjs/terminus'

import { AppLogger } from '@/core/logger'

@Controller('health')
export class HealthController {
  protected readonly logger: AppLogger

  constructor(cls: ClsService) {
    this.logger = AppLogger.create(cls, HealthController.name)
  }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @HealthCheck()
  async checkHealth() {
    return { status: true }
  }
}
