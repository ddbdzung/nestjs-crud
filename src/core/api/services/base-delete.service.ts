import { DeleteResult } from 'mongodb'
import { Document, FilterQuery } from 'mongoose'

import { BaseCreateOrUpdateService } from './base-create-or-update.service'
import { IExtraOptions } from './base.interface'

export class BaseDeleteService<
  TDoc extends Document,
> extends BaseCreateOrUpdateService<TDoc> {
  /* Delete */
  protected async preDeleteOne(
    _filter: FilterQuery<Partial<TDoc>>,
    _extraOptions?: IExtraOptions
  ) {
    /* */
  }

  protected async postDeleteOne(
    record: TDoc | null,
    _filter: FilterQuery<Partial<TDoc>>,
    _extraOptions?: IExtraOptions
  ) {
    return record
  }

  async deleteOneBy(
    filter: FilterQuery<Partial<TDoc>>,
    extraOptions: IExtraOptions = {}
  ) {
    if (!extraOptions.skipHooks) {
      await this.preDeleteOne(filter, extraOptions)
    }
    const deleted = await this.model.findOneAndDelete(filter)
    return extraOptions.skipHooks
      ? deleted
      : this.postDeleteOne(deleted, filter, extraOptions)
  }

  protected async preDeleteBy(
    _filter: FilterQuery<Partial<TDoc>>,
    _extraOptions?: IExtraOptions
  ) {
    /* */
  }

  protected async postDeleteBy(
    deleteResult: DeleteResult,
    _filter: FilterQuery<Partial<TDoc>>,
    _extraOptions?: IExtraOptions
  ) {
    return deleteResult
  }

  async deleteBy(
    filter: FilterQuery<Partial<TDoc>>,
    extraOptions: IExtraOptions = {}
  ): Promise<DeleteResult> {
    if (!extraOptions.skipHooks) {
      await this.preDeleteBy(filter, extraOptions)
    }
    const deleteResult = await this.model.deleteMany(filter)
    return extraOptions.skipHooks
      ? deleteResult
      : await this.postDeleteBy(deleteResult, filter, extraOptions)
  }
}
