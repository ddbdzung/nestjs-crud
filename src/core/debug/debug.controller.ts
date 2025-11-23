import { ConfigService } from '@config'
import { IsOptional, IsString } from 'class-validator'
import Debug from 'debug'

import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiPropertyOptional } from '@nestjs/swagger'

class SetDebugDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namespace?: string
}

@Controller('debug')
export class DebuggingController {
  private readonly debugNamespace: string
  private isEnable: boolean

  constructor(private readonly configService: ConfigService) {
    // Initialize khi controller được khởi tạo (sau khi DI hoàn tất)
    this.debugNamespace = this.configService.DEBUG_NAMESPACE || ''
    this.isEnable = Boolean(this.debugNamespace)
    if (this.isEnable) {
      Debug.enable(this.debugNamespace)
    }
  }

  @Get('status')
  async getStatus() {
    this.isEnable = Debug.enabled(this.debugNamespace)
    return {
      isEnable: this.isEnable,
      defaultNameSpace: this.debugNamespace,
    }
  }

  @Post('set')
  async setDebug(@Body() body: SetDebugDto) {
    if (!body?.namespace) {
      this.isEnable = false
      Debug.disable()
    } else {
      this.isEnable = true
      Debug.enable(body.namespace)
    }
    return {
      body,
      isEnable: this.isEnable,
      defaultNameSpace: body.namespace,
    }
  }
}
