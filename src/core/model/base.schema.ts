import { Schema as NSchema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { ApiHideProperty } from '@nestjs/swagger'

@NSchema({ _id: false })
export class Author {
  @Prop()
  id?: string

  @Prop()
  name?: string

  @Prop()
  picture?: string

  @Prop()
  email?: string
}
export const AuthorSchema = SchemaFactory.createForClass(Author)

export class BaseSchema {
  @ApiHideProperty()
  _doc?: Record<string, any>

  @ApiHideProperty()
  id?: string

  @Prop({ type: AuthorSchema })
  createdBy?: Author

  @Prop({ type: AuthorSchema })
  updatedBy?: Author

  @ApiHideProperty()
  isDeleted?: boolean

  @ApiHideProperty()
  deletedAt?: Date

  @ApiHideProperty()
  deletedBy?: Author

  @ApiHideProperty()
  createdAt?: Date

  @ApiHideProperty()
  updatedAt?: Date
}

export class CreateTimeSchema {
  @Prop({ default: Date.now })
  createdAt?: Date

  @Prop({ default: Date.now })
  updatedAt?: Date
}
