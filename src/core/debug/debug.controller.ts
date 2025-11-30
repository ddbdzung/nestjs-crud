import { IsOptional, IsString } from 'class-validator'
import Debug from 'debug'

import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiPropertyOptional } from '@nestjs/swagger'

import { config } from '@config'

const debugNamespace: string = config.DEBUG_NAMESPACE || ''
let isEnable = Boolean(debugNamespace)
if (isEnable) Debug.enable(debugNamespace)

class SetDebugDto {
  @ApiPropertyOptional({ default: debugNamespace })
  @IsOptional()
  @IsString()
  namespace?: string
}

@Controller('debug')
export class DebuggingController {
  @Get('status')
  async getStatus() {
    isEnable = Debug.enabled(debugNamespace)
    return {
      isEnable,
      defaultNameSpace: debugNamespace,
    }
  }

  @Post('set')
  async setDebug(@Body() body: SetDebugDto) {
    if (!body?.namespace) {
      isEnable = false
      Debug.disable()
    } else {
      isEnable = true
      Debug.enable(body.namespace)
    }
    return {
      body,
      isEnable,
      defaultNameSpace: body.namespace,
    }
  }
}
