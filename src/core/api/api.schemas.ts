import { ApiProperty } from '@nestjs/swagger'

import { HTTP_STATUS } from '../constants/http-status.constant'

export const defaultPayload = {
  success: true,
  statusCode: HTTP_STATUS.OK.code,
  message: HTTP_STATUS.OK.message,
  data: null,
  meta: {},
  timestamp: new Date(),
}

export abstract class Payload<TData, K = Record<string, any>> {
  @ApiProperty()
  success: boolean

  @ApiProperty()
  statusCode: number

  @ApiProperty()
  message: string

  @ApiProperty()
  data: TData | null

  @ApiProperty()
  meta: K

  @ApiProperty()
  timestamp: Date

  protected constructor(partial: Partial<Payload<TData, K>>) {
    Object.assign(this, {
      success: true,
      statusCode: HTTP_STATUS.OK.code,
      message: HTTP_STATUS.OK.message,
      data: null,
      meta: {} as K,
      timestamp: new Date(),
      ...partial,
    })
  }
}

class MetaCursor {
  @ApiProperty()
  after?: string

  @ApiProperty()
  before?: string
}

export class PaginatedMeta {
  @ApiProperty()
  total?: number

  @ApiProperty()
  totalPage?: number

  @ApiProperty()
  currentPage?: number

  @ApiProperty()
  limit?: number

  @ApiProperty()
  cursors?: MetaCursor;

  [s: string]: any

  constructor(query: Record<string, any>, partial: PaginatedMeta) {
    Object.assign(this, {
      ...partial,
      limit: query.limit,
      currentPage: query.page,
      totalPage:
        partial.totalPage ??
        Math.ceil(Number(partial.total) / Number(query.limit)),
    })
  }
}

export class PaginatedResult<TData> extends Payload<TData[], PaginatedMeta> {
  constructor(
    data: TData[],
    query: Record<string, any>,
    partial: PaginatedMeta,
    statusCode?: number,
    message?: string
  ) {
    super({
      data,
      meta: new PaginatedMeta(query, partial),
      statusCode: statusCode ?? HTTP_STATUS.OK.code,
      message: message ?? HTTP_STATUS.OK.message,
      success: true,
      timestamp: new Date(),
    })
  }
}
