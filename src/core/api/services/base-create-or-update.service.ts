import { UpdateResult } from 'mongodb'
import { Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'

import { BaseListService } from './base-list.service'
import { IExtraOptions } from './base.interface'

export class BaseCreateOrUpdateService<
  TDoc extends Document,
> extends BaseListService<TDoc> {
  /* Create Or Update */
  protected async preCreateOrUpdate(
    dto: Partial<TDoc>,
    _oldRecord: TDoc | null,
    _extraOptions?: IExtraOptions
  ) {
    return dto
  }

  protected async postCreateOrUpdate(
    record: TDoc,
    _dto: Partial<TDoc>,
    _oldRecord: TDoc | null,
    _extraOptions?: IExtraOptions
  ) {
    return record
  }

  /* Create */
  protected async preCreate(dto: Partial<TDoc>, extraOptions?: IExtraOptions) {
    return this.preCreateOrUpdate(dto, null, extraOptions)
  }

  protected async postCreate(
    record: TDoc,
    dto: Partial<TDoc>,
    extraOptions?: IExtraOptions
  ) {
    return this.postCreateOrUpdate(record, dto, null, extraOptions)
  }

  async create(
    dto: Partial<TDoc>,
    extraOptions: IExtraOptions = {}
  ): Promise<TDoc> {
    const doc = extraOptions.skipHooks
      ? dto
      : await this.preCreate(dto, extraOptions)
    const record = await new this.model(doc).save()
    return extraOptions.skipHooks
      ? record
      : this.postCreate(record, dto, extraOptions)
  }

  /* Upsert */

  /* Update */
  protected async preUpdateOne(
    record: TDoc,
    dto: Partial<TDoc>,
    extraOptions?: IExtraOptions
  ) {
    return this.preCreateOrUpdate(dto, record, extraOptions)
  }

  protected async postUpdateOne(
    newRecord: TDoc,
    oldRecord: TDoc,
    dto: Partial<TDoc>,
    extraOptions?: IExtraOptions
  ) {
    return this.postCreateOrUpdate(newRecord, dto, oldRecord, extraOptions)
  }

  async updateById(
    _id: string,
    dto: Partial<TDoc>,
    extraOptions: IExtraOptions = {}
  ): Promise<TDoc> {
    return this.updateOneBy({ _id }, dto, extraOptions)
  }

  async updateOneBy(
    filter: FilterQuery<Partial<TDoc>>,
    dto: Partial<TDoc>,
    extraOptions: IExtraOptions = {}
  ): Promise<TDoc> {
    let updateDto = dto
    const oldRecord = await this.getOneBy(filter, extraOptions)

    if (!extraOptions.skipHooks) {
      updateDto = await this.preUpdateOne(oldRecord, dto, extraOptions)
    }

    const newRecord = await this.model.findOneAndUpdate(filter, updateDto, {
      new: true,
    })
    if (!newRecord) {
      throw new Error('Record not found')
    }

    return extraOptions.skipHooks
      ? newRecord
      : this.postUpdateOne(newRecord, oldRecord, dto, extraOptions)
  }

  async findOneAndUpdate(
    filter: FilterQuery<Partial<TDoc>>,
    dto: UpdateQuery<TDoc>,
    options?: QueryOptions
  ): Promise<TDoc | null> {
    return this.model.findOneAndUpdate(filter, dto, { new: true, ...options })
  }

  async findByIdAndUpdate(
    id: string,
    dto: UpdateQuery<TDoc>,
    options?: QueryOptions
  ): Promise<TDoc | null> {
    return this.model.findOneAndUpdate(
      { _id: id } as FilterQuery<Partial<TDoc>>,
      dto,
      {
        new: true,
        ...options,
      }
    )
  }

  protected async preUpdateBy(
    _filter: FilterQuery<Partial<TDoc>>,
    dto: Partial<TDoc>,
    _extraOptions?: IExtraOptions
  ) {
    return dto
  }

  protected async postUpdateBy(
    updateResult: UpdateResult,
    _dto: Partial<TDoc>,
    _extraOptions?: IExtraOptions
  ) {
    return updateResult
  }

  async updateBy(
    filter: FilterQuery<Partial<TDoc>>,
    dto: Partial<TDoc>,
    extraOptions?: IExtraOptions
  ) {
    const doc = extraOptions?.skipHooks
      ? dto
      : await this.preUpdateBy(filter, dto, extraOptions)
    const updateResult = (await this.model.updateMany(filter, doc)) as any
    return extraOptions?.skipHooks
      ? updateResult
      : this.postUpdateBy(updateResult, dto, extraOptions)
  }
}
