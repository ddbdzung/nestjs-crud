import { Transform } from 'class-transformer'
import { TransformFnParams } from 'class-transformer/types/interfaces'
import { Types } from 'mongoose'

interface ITransformerOptions {
  each?: boolean
}

export function Trim() {
  return Transform(({ value }) => value?.toString()?.trim())
}

export function TransformBoolean() {
  return Transform(({ value }) =>
    [true, 'true', 'True', 'TRUE'].includes(value)
  )
}

export function TransformArray() {
  return Transform(({ value }) => {
    if (value === undefined) return []
    return Array.isArray(value) ? value : [value]
  })
}

export function TransformMongoId(options?: ITransformerOptions) {
  return Transform(
    ({ value }) =>
      value &&
      (options?.each
        ? value.map((v: any) => new Types.ObjectId(v))
        : new Types.ObjectId(value))
  )
}

function TransformBy(
  method: (...options: any[]) => any,
  requireType?: string,
  options?: ITransformerOptions
) {
  return Transform(({ value }) => {
    if (options?.each) {
      if (!Array.isArray(value)) return value

      try {
        return value.map((v) => method(v))
      } catch {
        return null
      }
    }

    if (requireType && typeof value !== requireType) return value

    try {
      return method(value)
    } catch {
      return null
    }
  })
}

export function TransformInt() {
  return TransformBy(parseInt)
}

export function TransformString(options?: ITransformerOptions) {
  return TransformBy(String, undefined, options)
}

export function TransformSort(sortFields?: string[]) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value

    const keys = value.replace(/ /g, '').split(',')
    return keys.reduce((acc: Record<string, number>, cur) => {
      const key = cur.replace(/^[+-]/, '')

      if (Array.isArray(sortFields) && !sortFields.includes(key)) return acc

      acc[key] = RegExp(/^-/).exec(cur) ? -1 : 1
      return acc
    }, {})
  })
}

export function AllowIf(transformFn: (params: TransformFnParams) => boolean) {
  return Transform((params: TransformFnParams) => {
    return transformFn(params) ? params.value : undefined
  })
}
