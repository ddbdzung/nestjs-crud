import { isMongoId } from 'class-validator'
import { isObject as _isObject } from 'lodash'

import { applyDecorators } from '@nestjs/common'
import { Prop, Schema } from '@nestjs/mongoose'
import { PropOptions } from '@nestjs/mongoose/dist/decorators/prop.decorator'
import { SchemaOptions } from '@nestjs/mongoose/dist/decorators/schema.decorator'
import { ApiProperty } from '@nestjs/swagger'

import { JsonObject } from '../api/common.interface'

interface NestSchemaOptions extends SchemaOptions {
  excludes?: string[]
  excludesOnPopulate?: string[]
  extendExcludesOnPopulate?: string[]
  transform?: (obj: any, ret: any) => any
}

function enumProperty(options: { enum: JsonObject }): any {
  const enumValues = Object.values(options.enum)
  return {
    enum: enumValues,
    description: enumValues.join(' | '),
  }
}

export function isPopObject(value: any) {
  return !isMongoId(value?.toString()) && _isObject(value)
}

function defaultExcludeOnPopulate(ret: Record<string, any>): string[] {
  const keys = Object.keys(ret)
  return keys.reduce((acc: string[], key: string) => {
    const keyId = key + 'Id'
    if (keys.includes(keyId) && isPopObject(ret[key])) {
      acc.push(keyId)
    }

    const keyIds = key.slice(0, key.length - 1) + 'Ids'
    if (
      keys.includes(keyIds) &&
      Array.isArray(ret[key]) &&
      ret[key].some((item: any) => isPopObject(item))
    ) {
      acc.push(keyIds)
    }

    return acc
  }, [])
}

export function NestSchema(options?: NestSchemaOptions) {
  return applyDecorators(
    Schema({
      timestamps: true,
      toJSON: {
        virtuals: true,
        transform: (obj: any, ret: Record<string, any>) => {
          if ('_id' in ret) {
            delete ret._id
          }
          if ('__v' in ret) {
            delete ret.__v
          }

          options?.excludes?.forEach((key: string) => {
            if (key in ret) {
              delete ret[key]
            }
          })

          const excludesOnPopulate =
            options?.excludesOnPopulate ?? defaultExcludeOnPopulate(ret)
          excludesOnPopulate
            .concat(options?.extendExcludesOnPopulate ?? [])
            .forEach((key: string) => {
              if (key in ret && isPopObject(ret[key])) {
                delete ret[key]
              }
            })

          options?.transform?.(obj, ret)
        },
      },
      ...options,
    })
  )
}

export const EnumColumn = (
  options: PropOptions & { enum: JsonObject; isRequired?: boolean }
) => {
  return applyDecorators(
    ApiProperty(enumProperty({ enum: options.enum })),
    Prop(options)
  )
}
