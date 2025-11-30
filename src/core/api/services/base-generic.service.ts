/* eslint-disable @typescript-eslint/no-unused-vars */
import { AppLogger } from '@/core/logger/logger.service'
import { snakeCase } from 'lodash'
import { Document, FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose'

import { Injectable, Logger as NestLogger } from '@nestjs/common'

import { Payload } from '../api.schemas'
import { NotFoundError } from '../exception.resolver'
import { BaseCacheService } from './base-cache.service'
import { IExtraOptions, IServiceOptions } from './base.interface'

export class BaseGenericService<TDoc extends Document> extends BaseCacheService {
  private readonly nestLogger: NestLogger = new NestLogger(BaseGenericService.name)
  protected readonly logger: AppLogger
  protected readonly model: Model<TDoc>
  protected override options?: IServiceOptions

  constructor(
    model: Model<TDoc>,
    loggingService: AppLogger,
    alias: string,
    options?: IServiceOptions
  ) {
    super(options)
    const aliasUp = snakeCase(alias.replace('Service', '')).toUpperCase()

    this.model = model
    this.options = Object.assign({}, options, { alias, aliasUp })
    this.logger = loggingService
    this.logger.setContext(alias)

    this.nestLogger.verbose(`Initialized ${alias} service`)
  }

  /* Model */
  recordOrNotFound<TData>(
    record: TData | null,
    payload?: Payload<any> | null,
    extraOptions?: IExtraOptions
  ): TData {
    if (!record && !extraOptions?.skipThrow) {
      const message = payload?.message || `${this.options?.aliasUp || 'UNKNOWN'}.NOT_FOUND`
      throw new NotFoundError(message)
    }

    return record as TData
  }

  /* Get One */
  private async findOne(
    filter: FilterQuery<TDoc>,
    projection?: ProjectionType<TDoc>,
    options?: QueryOptions<TDoc>
  ): Promise<TDoc | null> {
    if (filter.id) {
      filter._id = filter.id
      delete filter.id
    }

    return this.model.findOne(filter, projection, options)
  }

  async findOneBy(filter: FilterQuery<Partial<TDoc>>, extraOptions?: IExtraOptions): Promise<TDoc> {
    const record = await this.findOne(filter)
    return this.recordOrNotFound(record, null, extraOptions)
  }

  async getById(_id: string, extraOptions?: IExtraOptions): Promise<TDoc> {
    return this.getOneBy({ _id }, extraOptions)
  }

  async getOneBy(filter: FilterQuery<Partial<TDoc>>, extraOptions?: IExtraOptions): Promise<TDoc> {
    const record = await this.findOne(filter)
    return this.recordOrNotFound(record as TDoc | null, null, extraOptions)
  }

  // should relation in this method
  async getOne(
    filter: FilterQuery<TDoc>,
    projection?: ProjectionType<TDoc>,
    options?: QueryOptions<TDoc>,
    extraOptions?: IExtraOptions
  ): Promise<TDoc> {
    const record = await this.findOne(filter, projection, options)
    return this.recordOrNotFound(record, null, extraOptions)
  }
}
