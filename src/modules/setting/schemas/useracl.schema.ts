import { HydratedDocument, Types } from 'mongoose'

import { Prop, SchemaFactory } from '@nestjs/mongoose'

import { BaseSchema } from '@/core/model'

export class UserAcl extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Account', isRequired: true })
  accountId: string

  @Prop({ type: Boolean })
  isActive: boolean

  // @Prop({ type: })

  @Prop({ type: String })
  _note?: string // Note nếu có
}

export const UserAclSchema = SchemaFactory.createForClass(UserAcl)

export type UserAclDocument = HydratedDocument<UserAcl>
