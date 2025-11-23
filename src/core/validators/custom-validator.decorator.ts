import { Type } from 'class-transformer'
import {
  TypeHelpOptions,
  TypeOptions,
} from 'class-transformer/types/interfaces'
import {
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator'

import { applyDecorators } from '@nestjs/common'

export function GreaterThan(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'GreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(propertyValue: number, args: ValidationArguments) {
          return (
            propertyValue >
            args.object[args.constraints[0] as keyof typeof args.object]
          )
        },
        defaultMessage(args: ValidationArguments) {
          return `"${args.property}" must be greater than "${String(args.constraints[0])}"`
        },
      },
    })
  }
}

export function GreaterThanOrEqual(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'GreaterThanOrEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(propertyValue: number, args: ValidationArguments) {
          return (
            propertyValue >=
            args.object[args.constraints[0] as keyof typeof args.object]
          )
        },
        defaultMessage(args: ValidationArguments) {
          return `"${args.property}" must be greater than or equal to "${String(args.constraints[0])}"`
        },
      },
    })
  }
}

export function IsIntPositive(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsPositive(validationOptions),
    IsInt(validationOptions)
  )
}

export function IsIntNatural(validationOptions?: ValidationOptions) {
  return applyDecorators(Min(0, validationOptions), IsInt(validationOptions))
}

export function IsNumberNatural(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Min(0, validationOptions),
    IsNumber({ allowNaN: false, allowInfinity: false }, validationOptions)
  )
}

export function IsNumberOrString(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'IsNumberOrString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(propertyValue: any, _args: ValidationArguments) {
          return (
            typeof propertyValue === 'number' ||
            typeof propertyValue === 'string'
          )
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be number or string`
        },
      },
    })
  }
}

export function NestedType(
  typeFunction?: (type?: TypeHelpOptions) => any,
  validationOptions?: ValidationOptions,
  options?: TypeOptions
) {
  return applyDecorators(
    ValidateNested(validationOptions),
    Type(typeFunction, options)
  )
}

/**
 * CustomValidator decorator that uses a provided function and message.
 * @param options.validator function that returns true if valid
 * @param options.message error message when validation fails
 * @param options.validationOptions optional class-validator options
 */
export function CustomValidator(options: {
  validator: (value: any) => boolean
  message: string
  validationOptions?: ValidationOptions
}) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'CustomValidator',
      target: object.constructor,
      propertyName,
      options: options.validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return options.validator(value)
        },
        defaultMessage(_args: ValidationArguments) {
          return options.message
        },
      },
    })
  }
}

/**
 * Class-level validator decorator
 * @param options.validator - Hàm callback validate dữ liệu
 * @param options.validatorAsync - Hàm callback validate dữ liệu async
 * @param options.message - Message lỗi mặc định khi validation failed
 */
export function ClassValidator<T = any>(options: {
  validator?: (dto: T) => boolean
  validatorAsync?: (dto: T) => Promise<boolean>
  message?: string // Message lỗi mặc định khi validation failed
  readonly className?: string
}) {
  if (!options.validator && !options.validatorAsync) {
    throw new Error('validator or validatorAsync is required')
  }

  return function (target: any) {
    const currentValidators =
      Reflect.getMetadata('class-validator', target) || []
    const currentMetadata = {
      validator: options.validator,
      validatorAsync: options.validatorAsync,
      message: options.message || 'Dữ liệu không hợp lệ',
      className: target?.name || 'unknown',
    }
    currentValidators.push(currentMetadata)

    Reflect.defineMetadata('class-validator', currentValidators, target)
  }
}
