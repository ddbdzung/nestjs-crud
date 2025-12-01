import 'reflect-metadata'

import { Type } from '@nestjs/common'
import {
  OmitType as BaseOmitType,
  PickType as BasePickType,
  PartialType,
} from '@nestjs/swagger'

/**
 * Copy metadata from parent class to child class
 * @param parent Parent class
 * @param child Child class
 * @param metadataKeys Array of metadata keys to copy (defaults to ['class-validator'])
 */
export function copyClassMetadata<T>(
  parent: Type<T>,
  child: Type<any>,
  metadataKeys: string[] = ['class-validator']
): void {
  metadataKeys.forEach((key) => {
    const metadata = Reflect.getMetadata(key, parent)
    if (metadata) {
      Reflect.defineMetadata(key, metadata, child)
    }

    // Also copy from prototype if exists (for inherited metadata)
    if (parent.prototype) {
      const protoMetadata = Reflect.getMetadata(key, parent.prototype)
      if (protoMetadata && child.prototype) {
        Reflect.defineMetadata(key, protoMetadata, child.prototype)
      }
    }
  })
}

export function CustomOmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  inherit = false
): Type<Omit<T, (typeof keys)[number]>> {
  const newClass = BaseOmitType(classRef, keys)
  if (inherit) {
    copyClassMetadata(classRef, newClass)
  }
  return newClass
}

export function CustomPickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  inherit = false
): Type<Pick<T, (typeof keys)[number]>> {
  const newClass = BasePickType(classRef, keys)
  if (inherit) {
    copyClassMetadata(classRef, newClass)
  }
  return newClass
}

export function PartialOmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  inherit = false
): Type<Partial<Omit<T, (typeof keys)[number]>>> {
  const newClass = PartialType(BaseOmitType(classRef, keys))
  if (inherit) {
    copyClassMetadata(classRef, newClass)
  }
  return newClass
}

export function PartialPickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  inherit = false
): Type<Partial<Pick<T, (typeof keys)[number]>>> {
  const newClass = PartialType(BasePickType(classRef, keys))
  if (inherit) {
    copyClassMetadata(classRef, newClass)
  }
  return newClass
}
