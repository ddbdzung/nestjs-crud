import { Schema } from 'mongoose'

export function removePrivatePlugin(schema: Schema): void {
  const ignoreStartWithChars = ['_', '__']
  const manageId = (ret: any) => {
    if (!ret) {
      return
    }

    if (!ret.id && ret._id) {
      ret.id = ret._id.toString()
    }

    if (ret.id && ret._id) {
      delete ret._id
    }
  } // Ensure id is always present and _id is always removed

  // Retrieve and wrap toJSON transform
  const toJSONOptions = (schema.get('toJSON') as any) || {}
  const originalTransform = toJSONOptions.transform
  schema.set('toJSON', {
    ...toJSONOptions,
    transform(doc: any, ret: any, options: any) {
      Object.keys(ret).forEach((key) => {
        manageId(ret)
        if (ignoreStartWithChars.some((char) => key.startsWith(char)))
          delete ret[key]
      })
      if (typeof originalTransform === 'function') {
        return originalTransform.call(this, doc, ret, options)
      }
      return ret
    },
  })

  // Retrieve and wrap toObject transform
  const toObjectOptions = (schema.get('toObject') as any) || {}
  const originalObjectTransform = toObjectOptions.transform
  schema.set('toObject', {
    ...toObjectOptions,
    transform(doc: any, ret: any, options: any) {
      Object.keys(ret).forEach((key) => {
        manageId(ret)
        if (ignoreStartWithChars.some((char) => key.startsWith(char)))
          delete ret[key]
      })
      if (typeof originalObjectTransform === 'function') {
        return originalObjectTransform.call(this, doc, ret, options)
      }
      return ret
    },
  })
}
