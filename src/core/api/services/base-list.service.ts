import _ from 'lodash'
import {
  Document,
  FilterQuery,
  PopulateOption,
  ProjectionType,
  QueryOptions,
} from 'mongoose'

import { isUndefined } from '@nestjs/common/utils/shared.utils'

import { PaginatedResult } from '../api.schemas'
import { IExtraOptions } from '../index'
import {
  PaginationDto,
  QuerySpecificationDto,
} from '../query-specification.dto'
import { BaseGenericService } from './base-generic.service'

export class BaseListService<
  TDoc extends Document,
> extends BaseGenericService<TDoc> {
  /* List */
  async list(query?: QuerySpecificationDto, extraOptions?: IExtraOptions) {
    const { filter, projection, options } = await this.preFindAll(
      query,
      extraOptions
    )
    delete options.limit
    delete options.skip
    if (!options.sort) options.sort = { createdAt: -1 } // Default sort by createdAt if not specified

    // Apply select từ extraOptions nếu có
    const finalProjection = extraOptions?.select || projection

    let dbQuery = this.model.find(filter, finalProjection, options)
    if (extraOptions?.lean) {
      dbQuery = dbQuery.lean() as any
    }

    const data: TDoc[] = await dbQuery
    return await this.postFindAll(data, query, extraOptions)
  }

  async listPaginate(
    query?: QuerySpecificationDto,
    extraOptions?: IExtraOptions
  ): Promise<PaginatedResult<TDoc>> {
    const { filter, projection, options } = await this.preFindAll(
      query,
      extraOptions
    )
    const total = await this.model.countDocuments(filter)

    if (!options.sort) options.sort = { createdAt: -1 } // Default sort by createdAt if not specified

    // Apply select từ extraOptions nếu có
    const finalProjection = extraOptions?.select || projection

    let dbQuery = this.model.find(filter, finalProjection, options)
    if (extraOptions?.lean) {
      dbQuery = dbQuery.lean() as any
    }

    let data: TDoc[] = await dbQuery
    data = await this.postFindAll(data, query, extraOptions)
    return new PaginatedResult(data, query || {}, { total })
  }

  async find(
    filter: FilterQuery<TDoc>,
    projection?: ProjectionType<TDoc>,
    options?: QueryOptions<TDoc>
  ) {
    return this.model.find(filter, projection, options)
  }

  /* Helper */
  protected getFilter(
    query: QuerySpecificationDto = {},
    _extraOptions?: IExtraOptions
  ): FilterQuery<TDoc> {
    const { filter, q, searchFields } = query
    const resultFilter: FilterQuery<TDoc> = (
      filter ? { ...filter } : {}
    ) as FilterQuery<TDoc>
    if (filter) {
      Object.entries(filter).forEach(
        ([filterKey, filterValue]: [string, any]) => {
          if (isUndefined(filterValue)) {
            delete resultFilter[filterKey as keyof typeof resultFilter]
            return
          }

          if (filterKey === 'id') {
            ;(resultFilter as any)._id = filterValue
            delete resultFilter[filterKey as keyof typeof resultFilter]
          } else if (filterKey === 'ids') {
            ;(resultFilter as any)._id = filterValue
            delete resultFilter[filterKey as keyof typeof resultFilter]
          } else if (filterKey.endsWith('Ids')) {
            ;(resultFilter as Record<string, any>)[
              filterKey.replace(/Ids$/, 'Id')
            ] = filterValue
            delete (resultFilter as Record<string, any>)[filterKey]
          } else if (
            filterValue &&
            typeof filterValue === 'object' &&
            'fromDate' in filterValue &&
            'toDate' in filterValue
          ) {
            // Handle DateTimeRangeDto objects (fromDate, toDate)
            ;(resultFilter as any)[filterKey] = {
              $gte: new Date(filterValue.fromDate as string | number | Date),
              $lte: new Date(filterValue.toDate as string | number | Date),
            }
          } else if (filterKey.includes('_')) {
            this.processFilter(resultFilter, [filterKey, filterValue])
          } else {
            ;(resultFilter as any)[filterKey] = filterValue
          }
        }
      )
    }

    if (q && searchFields?.length) {
      _.set(
        resultFilter,
        '$or',
        searchFields.map((field: string) => ({ [field]: new RegExp(q, 'ui') }))
      )
    }

    return resultFilter
  }

  protected getSort(
    query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ) {
    return query?.sort
  }

  protected getPaginate(
    query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ) {
    return {
      limit: query?.limit,
      skip: PaginationDto.getSkip(query),
    }
  }

  protected getPopulate(
    _query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ): PopulateOption {
    return { populate: undefined }
  }

  protected getOptions(
    query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ): QueryOptions<TDoc> {
    return Object.assign(
      {},
      { sort: this.getSort(query) },
      this.getPaginate(query),
      this.getPopulate(query)
    )
  }

  protected getProjection(
    _query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ): ProjectionType<TDoc> {
    return {}
  }

  protected async preFindAll(
    query?: QuerySpecificationDto,
    extraOptions?: IExtraOptions
  ) {
    return {
      filter: this.getFilter(query, extraOptions),
      projection: this.getProjection(query, extraOptions),
      options: this.getOptions(query, extraOptions),
    }
  }

  protected async postFindAll(
    data: TDoc[],
    _query?: QuerySpecificationDto,
    _extraOptions?: IExtraOptions
  ) {
    return data
  }

  /* Private */
  private processFilter(
    filter: Record<string, any>,
    [filterKey, filterValue]: [string, any]
  ): FilterQuery<TDoc> | undefined {
    delete filter[filterKey]
    const keys = filterKey.split('_')
    const suffix = keys.pop()?.toUpperCase()
    if (!suffix) return undefined
    let key = keys.join('_')
    key = key === 'id' ? '_id' : key

    switch (suffix) {
      // ARRAY
      case 'IN':
        return (filter[key] = { $in: filterValue })
      case 'INCLUDE':
        return (filter[key] = filterValue)
      case 'EXCLUDE':
      case 'CONTAINALL':
        return (filter[key] = { $all: filterValue })
      case 'CONTAINANY':
        return (filter[key] = { $in: filterValue })

      // STRING
      case 'CONTAIN':
      case 'STARTWITH':
      case 'ENDWITH':
        return

      // NUMBER, DATE
      case 'GTE':
        return (filter[key] = { $gte: filterValue })
      case 'GT':
        return (filter[key] = { $gt: filterValue })
      case 'LTE':
        return (filter[key] = { $lte: filterValue })
      case 'LT':
        return (filter[key] = { $lt: filterValue })
      case 'RANGE':
        return (filter[key] = { $gte: filterValue[0], $lte: filterValue[1] })
      case 'BOUND':
        return (filter[key] = { $gt: filterValue[0], $lt: filterValue[1] })

      // COMMON
      case 'NE':
        return (filter[key] = { $ne: filterValue })
      case 'ISNULL':
        return (filter[key] = { $exists: false })
      case 'EXIST':
        return (filter[key] = { $exists: true })
      default:
        return (filter[key] = filterValue)
    }
  }
}
