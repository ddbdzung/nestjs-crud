import { Document, FilterQuery, Model } from 'mongoose'

import { AppLogger } from '@/core/logger'

import { BaseDeleteService } from './base-delete.service'
import { IServiceOptions } from './base.interface'

export class BaseService<
  TDoc extends Document,
> extends BaseDeleteService<TDoc> {
  protected override readonly model: Model<TDoc>
  protected override readonly logger: AppLogger
  protected readonly alias: string

  protected async exists(
    filter: FilterQuery<TDoc>
  ): Promise<{ _id: any } | null> {
    return await this.model.exists(filter)
  }

  constructor(
    model: Model<TDoc>,
    loggingService: AppLogger,
    alias: string,
    options?: IServiceOptions
  ) {
    super(model, loggingService, alias, options)
    this.model = model
    this.logger = loggingService
    this.alias = alias

    this.model.on('index', (err: Error) => {
      if (err) {
        this.logger.error(
          `[Mongo Index] ${this.alias} index build failed: ${err.message}`,
          err
        )
        // TODO: Handle error manually or disable in production
        throw err
      }
    })
  }
}
