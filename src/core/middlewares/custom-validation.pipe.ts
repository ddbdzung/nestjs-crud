import { plainToInstance } from 'class-transformer'

import {
  ArgumentMetadata,
  Injectable,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common'
import { ValidationError as NestValidationError } from '@nestjs/common/interfaces/external/validation-error.interface'

import { ValidationError } from '../api/exception.resolver'

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor(private readonly options?: ValidationPipeOptions) {
    super(options)
  }

  override async transform(
    value: { filter: any; elasticSearch: any },
    metadata: ArgumentMetadata
  ) {
    if (metadata.type === 'query' && value?.filter)
      try {
        value.filter = JSON.parse(value?.filter)
      } catch (_e: any) {
        /* empty */
      }

    const { metatype } = metadata
    if (!metatype) {
      return value
    }

    return super.transform(value, metadata)
  }
}
export const exceptionFactory = (
  validationErrors: NestValidationError[] = []
) => new ValidationError(validationErrors)

@Injectable()
export class ClassValidationPipe extends CustomValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super(options)
  }

  override async transform(value: any, metadata: ArgumentMetadata) {
    const validatedValue = await super.transform(value, metadata)
    const { metatype } = metadata

    if (!metatype) return validatedValue

    const validatorOptions =
      Reflect.getMetadata('class-validator', metatype) || []
    if (validatorOptions.length === 0) return validatedValue

    const dtoInstance = plainToInstance(metatype, validatedValue)

    // Xử lý thực thi lần lượt các validator từ base -> derived class
    for (const {
      validator,
      validatorAsync,
      message,
      className,
    } of validatorOptions) {
      let isValid: boolean | Error = true

      try {
        if (validator) {
          isValid = validator(dtoInstance)
        } else if (validatorAsync) {
          isValid = await validatorAsync(dtoInstance)
        }
      } catch (error) {
        isValid = error as Error
      }

      if (isValid !== true) {
        const errorMessage =
          isValid instanceof Error ? isValid.message || message : message

        throw new ValidationError([
          {
            target: dtoInstance,
            property: className,
            children: [],
            constraints: { classValidator: errorMessage },
          },
        ])
      }
    }

    return validatedValue
  }
}
