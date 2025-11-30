import { IsArray, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { TransformArray } from '../validators/validator.transformer'

export class MongoIdDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string
}

export class MongoIdsDto {
  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  @TransformArray()
  ids?: string[]
}

export class PaginatedMeta {
  @ApiProperty()
  page: number

  @ApiProperty()
  pageSize: number

  @ApiProperty()
  totalPages: number
}

export class PaginatedResult<T = any> {
  @ApiProperty()
  total: number

  @ApiProperty({ type: 'array' })
  data: T[]

  @ApiProperty({ type: PaginatedMeta })
  meta: PaginatedMeta
}
