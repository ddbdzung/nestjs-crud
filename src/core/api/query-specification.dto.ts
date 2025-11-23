import { config } from '@config'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator'
import * as _ from 'lodash'

import { Type as NestType } from '@nestjs/common'
import {
  ApiHideProperty,
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger'
import { ApiPropertyOptions } from '@nestjs/swagger/dist/decorators/api-property.decorator'

import { TransformSort } from '../validators/validator.transformer'

// PAGINATION
class PaginationSpecificationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @Max(config.PAGINATION_PAGE_SIZE)
  limit?: number = config.PAGINATION_PAGE_SIZE

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1
}

export class PaginationDto extends PickType(PaginationSpecificationDto, [
  'limit',
  'page',
]) {
  static readonly getSkip = (
    query?: Partial<PaginationSpecificationDto>
  ): number => {
    return (
      ((query?.page || 1) - 1) * (query?.limit || config.PAGINATION_PAGE_SIZE)
    )
  }
}

// SORT
export class SortSpecificationDto {
  @ApiPropertyOptional({
    type: String,
    example: 'id,-createdAt',
  })
  @IsOptional()
  @TransformSort()
  @IsObject()
  sort?: Record<string, any>
}

// SEARCH
class SearchSpecificationDto {
  @ApiPropertyOptional({ description: 'Input text for search' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  searchType?: string

  @ApiHideProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchFields?: string[]
}
export class SearchDto extends PickType(SearchSpecificationDto, [
  'q',
  'searchFields',
]) {}
export class SearchFieldsDto extends PickType(SearchSpecificationDto, [
  'q',
  'searchFields',
]) {}

// QUERY
export class QuerySpecificationDto<
  TFilter = Record<string, any>,
> extends IntersectionType(PaginationDto, SortSpecificationDto, SearchDto) {
  filter?: TFilter
}

export interface IFactoryOption {
  sortFields?: string[]
  searchFields?: string[]
  filterCls?: NestType
  filterExample?: string | Record<string, any>
  filterOptions?: ApiPropertyOptions
  paginationOptions?: {
    maxLimit?: number
    defaultLimit?: number
  }
}

export type FactoryType<TFilter> = NestType<
  Pick<QuerySpecificationDto<TFilter>, keyof QuerySpecificationDto<TFilter>>
>

export const factoryQueryDto = <TFilter>(
  options: IFactoryOption = {}
): FactoryType<TFilter> => {
  let { filterExample = '{"createdById": 1}' } = options
  if (typeof filterExample !== 'string') {
    filterExample = JSON.stringify(filterExample)
  }

  class Factory {
    @ApiPropertyOptional({
      type: String,
      example: 'id,-createdAt',
    })
    @IsNotEmpty()
    @TransformSort(options.sortFields)
    @IsObject()
    sort?: Record<string, any>

    @ApiPropertyOptional({ name: 'searchFields[]' })
    @IsNotEmpty()
    @IsIn(options.searchFields ?? [], { each: true })
    @IsString({ each: true })
    @IsArray()
    searchFields?: string[] = options.searchFields

    @ApiPropertyOptional({
      type: String,
      ...options.filterOptions,
      description:
        (options.filterCls?.name ?? '') +
        '<br>' +
        (options.filterOptions?.description
          ? options.filterOptions.description + '<br>'
          : '') +
        'example: ' +
        filterExample,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => options.filterCls ?? Object)
    filter?: TFilter
  }
  class FactoryOptional extends PartialType(Factory) {}

  const pickOptionKeys: (keyof FactoryOptional)[] = []
  if (options.sortFields) {
    pickOptionKeys.push('sort')
  }
  if (options.searchFields) {
    pickOptionKeys.push('searchFields')
  }
  if (options.filterCls) {
    pickOptionKeys.push('filter')
  }

  const pickRequireKeys: (keyof Factory)[] = []
  if (options.filterOptions?.required) {
    const filterIndex = pickOptionKeys.indexOf('filter')
    if (filterIndex !== -1) {
      pickOptionKeys.splice(filterIndex, 1)
      pickRequireKeys.push('filter')
    }
  }

  return options.filterOptions?.required
    ? IntersectionType(
        PickType(FactoryOptional, pickOptionKeys),
        PickType(Factory, pickRequireKeys)
      )
    : PickType(FactoryOptional, pickOptionKeys)
}

export const factorySpecificationQueryDto = <TFilter>(
  options: IFactoryOption = {}
): FactoryType<TFilter> => {
  const limitMax =
    options.paginationOptions?.maxLimit ?? config.PAGINATION_PAGE_SIZE

  // custom pagination with adjustable max limit
  class CustomPaginationDto extends PaginationDto {
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    @Max(limitMax)
    override limit?: number =
      options.paginationOptions?.defaultLimit ?? limitMax
  }

  class SpecificationDto extends IntersectionType(
    CustomPaginationDto,
    SortSpecificationDto,
    SearchSpecificationDto,
    factoryQueryDto<TFilter>(options)
  ) {}

  return SpecificationDto
}
